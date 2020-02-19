/*
 *  @license
 *    Copyright 2018 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

"use strict";

import * as url from '../src/url.js';

describe('url utils', () => {
  describe('parseHash', () => {
    it('Parses hashes into a map', () => {
      const input = 'foo=bar&bar=baz';
      const output = url.parseHash(input);
      expect(output).to.be.instanceOf(Map);

      expect(output).to.have.all.keys(['foo', 'bar']);

      expect(output.get('foo')).to.equal('bar');
      expect(output.get('bar')).to.equal('baz');

    });

    it('Handles strings starting with \'#\'', () => {
      const input = '#foo=bar&bar=baz';
      const output = url.parseHash(input);
      expect(output).to.have.all.keys(['foo', 'bar']);
    });

    it('Handles empty strings', () => {
      const input = '';
      const output = url.parseHash(input);
      expect(output).to.be.a('map');
      expect(output).to.be.empty;
    });
  });
});
