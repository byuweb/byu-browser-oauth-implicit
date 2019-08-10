/*
 *  @license
 *    Copyright 2019 Brigham Young University
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

const pages = [
  ['index.html', 'Home'],
  ['user-info.html', 'User Info'],
  ['require-auth.html', 'Require Login'],
  ['api-calls.html', 'API Calls'],
  ['sub-routes.html', 'Sub-Routes'],
  ['https://github.com/byuweb/byu-browser-oauth-implicit', 'GitHub <i class="fab fa-github"></i>'],
];

const branch = 'debug-log';

export function enhanceHeader(page) {
  const header = document.querySelector('byu-header');
  const menu = header.querySelector('byu-menu');
  // DO WHAT I SAY, NOT WHAT I DO - never assemble DOM with string concatenation in production! Security issues will abound!
  menu.innerHTML = pages.map(([href, name]) => {
    return `<a href="${href}" ${href === page ? 'active' : ''}>${name}</a>`
  }).join('\n');

  const srcLink = document.createElement('a');
  srcLink.href = `https://github.com/byuweb/byu-browser-oauth-implicit/blob/${branch}/examples/${page}`;
  srcLink.slot = 'actions';
  srcLink.target = '_blank';
  srcLink.innerHTML = '<i class="fas fa-code"></i> View Source';
  header.append(srcLink);
}
