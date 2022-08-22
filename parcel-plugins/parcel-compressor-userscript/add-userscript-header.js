//
//
"use strict";

const { Compressor } = require("@parcel/plugin");
const { Readable } = require("node:stream");
const fs = require("node:fs");
const readline = require("node:readline");

exports.default = new Compressor({
  compress({ stream, options, logger }) {
    return {
      stream: userscriptHeaderInsertedStream(stream, options, logger),
    };
  },
});

function userscriptHeaderInsertedStream(stream, options, logger) {
  logger.info({ message: "inserting userscript header" });
  return Readable.from(
    (async function* () {
      try {
        // console.log("process.env", process.env);
        // console.log("options.env:", options.env);
        const { source } = require(options.env.npm_package_json);
        const sourceLines = readline.createInterface({
          input: fs.createReadStream(source),
          crlfDelay: Infinity,
        });

        let beforeHeader = true;
        for await (const line of sourceLines) {
          if (beforeHeader) {
            if (/^\/\/ ==UserScript==$/.test(line)) {
              beforeHeader = false;
              yield line + "\n";
            }
          } else {
            yield line + "\n";
            if (/^\/\/ ==\/UserScript==$/.test(line)) {
              break;
            }
            // TODO: check keyword names
          }
        }
        sourceLines.close();

        for await (let chunk of stream) {
          yield chunk;
        }
      } catch (err) {
        console.error("thrown:", err);
        throw err;
      }
    })()
  );
}
