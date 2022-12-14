//
//
// import '@types/greasemonkey';

export default class FilterConfig {

    static async load() {
        const promises = [
            GM.getValue(_hidePromotedKey, true),
            GM.getValue(_hiddenSubredditsKey, "[]")
        ];
        return Promise.all(promises).then((values) => {
            // console.info("saved values:", values);
            let subreddits = values[1] as (string | string[]);
            if (typeof subreddits === 'string') {
                subreddits = JSON.parse(subreddits) as string[];
            }
            return new FilterConfig({
                hidePromoted: values[0] as boolean,
                hiddenSubreddits: subreddits
            });
        });
    }

    constructor(config: Config) {
        this._hidePromoted = config.hidePromoted;
        this._hiddenSubreddits = new Set(config.hiddenSubreddits);
    }
    private _hidePromoted: boolean;
    private _hiddenSubreddits: Set<string>;

    toJSON() {
        return {
            hidePromoted: this._hidePromoted,
            hiddenSubreddits: Array.from(this._hiddenSubreddits)
        };
    }

    get hidePromoted() {
        return this._hidePromoted;
    }
    set hidePromoted(newValue) {
        if (this._hidePromoted == newValue) {
            return;
        }
        this._hidePromoted = newValue;
        GM.setValue(_hidePromotedKey, newValue);
        // TODO refresh
    }

    sorted() {
        return Array.from(this._hiddenSubreddits).sort((first, second) => {
            return first.localeCompare(second,
                undefined, { sensitivity: 'case' });
        });
    }

    isHidden(sub: string) {
        return this._hiddenSubreddits.has(sub)
    }

    filter(sub: string, hide: boolean) {
        if (this.isHidden(sub) == hide) {
            return false;
        }
        if (hide) this._hiddenSubreddits.add(sub);
        else /**/ this._hiddenSubreddits.delete(sub);

        const arrayValue = [...this._hiddenSubreddits];
        try {
            GM.setValue(_hiddenSubredditsKey, arrayValue as any);
        }
        catch {
            GM.setValue(_hiddenSubredditsKey, JSON.stringify(arrayValue));
        }
        return true;
    }
}

type Config = {
    hidePromoted: boolean,
    hiddenSubreddits: string[]
}

const _hidePromotedKey = 'hidePromoted';
const _hiddenSubredditsKey = 'hiddenSubreddits';

function lowerBound<T>(item: T, array: T[], cmp?: (a: T, b: T) => number) {
    const _cmp = cmp || ((a, b) => a < b ? -1 : a > b ? 1 : 0);
    let lo = 0, hi = array.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        const ord = _cmp(item, array[mid]);
        if (ord == 0) {
            return mid;
        }
        if (ord < 0) {
            hi = mid;
        } else {
            lo = mid + 1;
        }
    }
    return -lo - 1;
}

function sortedInsert<T>(item: T, array: T[], cmp?: (a: T, b: T) => number) {
    const ix = lowerBound(item, array, cmp);
    console.log("item", item, "ix", ix, "value", array[ix]);
    if (ix < 0) {
        array.splice(-ix - 1, 0, item);
    }
}
