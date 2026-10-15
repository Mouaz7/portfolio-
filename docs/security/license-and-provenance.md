# License and provenance gate

Run `npm run test:licenses` before publication. The command inventories every
installed package represented by `package-lock.json` and fails when a package
has no declared license or declares GPL, AGPL, or SSPL licensing.

The current release intent is publicly visible proprietary code, not open
source. `LICENSE` must say “All rights reserved”, README must describe the same
intent, `package.json` must remain `UNLICENSED`, and the GitHub description and
publication messaging must not call the repository open source. Changing this
model requires a separate human licensing decision.

This automated check is only a screening step. A human reviewer must still
approve:

- the origin and publication rights for source code, fonts, photographs,
  logos, CV files, videos, and copied snippets;
- compliance with attribution, notice, trademark, and redistribution terms;
- any dependency license expression that is conditional, dual-licensed, or
  unfamiliar;
- the repository's own `UNLICENSED` status before making it public.

Record the reviewer, date, scope, exceptions, and evidence in the release or
pull-request record. Do not infer approval from a passing automated scan.
