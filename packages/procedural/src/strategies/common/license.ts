/**
 * License Strategy
 *
 * Automatically generates an MIT License file for all generated projects.
 * This ensures that the output of the UPG "factory" is legally clear from moment zero.
 */

import type { GenerationStrategy } from '../../types.js';

export const LicenseStrategy: GenerationStrategy = {
  id: 'license',
  name: 'MIT License Generation',
  priority: 0, // Run early to ensure file exists

  matches: () => true, // Applies to ALL generated projects

  apply: async ({ files, projectName }) => {
    const year = new Date().getFullYear();

    files['LICENSE'] = `MIT License

Copyright (c) ${year} ${projectName} Authors (Generated via Retro Vibecoder UPG)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
  },
};
