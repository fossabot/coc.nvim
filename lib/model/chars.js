"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require('../util/logger')('model-chars');
class Range {
    constructor(start, end) {
        this.start = start;
        this.end = end ? end : start;
    }
    static fromKeywordOption(keywordOption) {
        let parts = keywordOption.split(',');
        let ranges = [];
        for (let part of parts) {
            if (part == '@') {
                // number and letters
                ranges.push(new Range(65, 90));
                ranges.push(new Range(97, 122));
                ranges.push(new Range(192, 255));
            }
            else if (/^\d+-\d+$/.test(part)) {
                let ms = part.match(/^(\d+)-(\d+)$/);
                ranges.push(new Range(Number(ms[1]), Number(ms[2])));
            }
            else if (/^\d+$/.test(part)) {
                ranges.push(new Range(Number(part)));
            }
            else {
                let c = part.charCodeAt(0);
                if (!ranges.some(o => o.contains(c))) {
                    ranges.push(new Range(c));
                }
            }
        }
        return ranges;
    }
    contains(c) {
        return c >= this.start && c <= this.end;
    }
}
exports.Range = Range;
class Chars {
    constructor(keywordOption) {
        this.ranges = Range.fromKeywordOption(keywordOption);
    }
    addKeyword(ch) {
        let c = ch.charCodeAt(0);
        let { ranges } = this;
        if (!ranges.some(o => o.contains(c))) {
            ranges.push(new Range(c));
        }
    }
    setKeywordOption(keywordOption) {
        this.ranges = Range.fromKeywordOption(keywordOption);
    }
    matchKeywords(content, min = 3) {
        content = content + '\n';
        let res = [];
        let str = '';
        for (let i = 0, l = content.length; i < l; i++) {
            let ch = content[i];
            if (this.isKeywordChar(ch)) {
                str = str + ch;
            }
            else {
                if (str.length >= min && res.indexOf(str) == -1) {
                    res.push(str);
                }
                str = '';
            }
        }
        return res;
    }
    isKeywordChar(ch) {
        let { ranges } = this;
        let c = ch.charCodeAt(0);
        if (c > 255)
            return false;
        return ranges.some(r => r.contains(c));
    }
    isKeyword(word) {
        let { ranges } = this;
        for (let i = 0, l = word.length; i < l; i++) {
            let ch = word.charCodeAt(i);
            // for speed
            if (ch > 255)
                return false;
            if (ranges.some(r => r.contains(ch)))
                continue;
            return false;
        }
        return true;
    }
}
exports.Chars = Chars;
//# sourceMappingURL=chars.js.map