// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
/**
 * lint-staged runs the minimum required tools on files that are being
 * committed. Keep commands here tight - anything slow belongs in CI.
 */
module.exports = {
  '*.{ts,html}': ['eslint --fix', 'prettier --write'],
  '*.css': ['stylelint --fix', 'prettier --write'],
  '*.{json,md,yml}': ['prettier --write --ignore-unknown'],
};
