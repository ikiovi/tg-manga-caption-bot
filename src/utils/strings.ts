/* 
    Copyright 2018 Stephen Brown
    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
    to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
    and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
    INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
    DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    [https://github.com/stephenjjbrown/string-similarity-js/blob/master/src/string-similarity.ts]
*/

/**
 * Calculate similarity between two strings
 * @param {string} str1 First string to match
 * @param {string} str2 Second string to match
 * @param {number} [substringLength=2] Optional. Length of substring to be used in calculating similarity. Default 2.
 * @param {boolean} [caseSensitive=false] Optional. Whether you want to consider case in string matching. Default false;
 * @returns Number between 0 and 1, with 0 being a low match score.
 */
export function getSimilarity(str1: string, str2: string, substringLength = 2, caseSensitive = false) {
    if (!caseSensitive) {
        str1 = str1.toLowerCase();
        str2 = str2.toLowerCase();
    }

    if (str1.length < substringLength || str2.length < substringLength)
        return 0;

    const len = substringLength - 1;
    const map = new Map<string, number>();

    for (let i = 0; i < str1.length - len; i++) {
        const substr1 = str1.slice(i, i + substringLength);
        map.set(substr1, (map.get(substr1) ?? 0) + 1);
    }

    let match = 0;
    for (let j = 0; j < str2.length - len; j++) {
        const substr2 = str2.slice(j, j + substringLength);
        const count = map.get(substr2) ?? 0;
        if (count <= 0) continue;
        map.set(substr2, count - 1);
        match++;
    }

    return (match * 2) / (str1.length + str2.length - (len * 2));
}
