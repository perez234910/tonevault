# Observed AI asset mistake — human evaluation pending

Date: November 8, 2026 (Asia/Manila). This records one actual asset-selection mistake, not three invented failures or a claim of completed student reasoning.

Original AI implementation in `src/lib/catalog/mock-data.ts` mapped item index to `/preview/guitar-${index + 1}.jpg` and a corresponding `-detail.jpg`, assuming eight old seed image sources could be downloaded. That original expression is preserved here. Original source IDs were 1510915361894-db8b60106cb1, 1514649923863-ceaf2794ba05, 1508183578693-95d001c0c289, 1556449895-a33c9dba33dd, 1550291659-44e8d0e8a4b5, 1511379938547-c1f69419868d, 1564186763535-ebb21ef5277f, 1516925043377-52c8fb5c4c1e.

Observed result: curl returned HTTP 404 (exit 56) for sources 2, 3, 5 and 8 and both crops. Two alternate sources from the seed (1516924962500-2b4b3da39afd and 1525201548942-d8732f6617f0) also returned 404. A local asset check exited 1 with missing paths for items 2, 3, 5 and 8 (base/detail). Visual inspection also found source 4 depicted a ukulele. These defects were caught before claiming the UI passed.

Correction: fixtures explicitly reuse two downloaded/visually inspected guitar illustrations (source 6 studio and source 7 electric guitar), with local crops. Working but unsuitable/unused images were removed. The regression test checks every fixture image exists; browser checks must additionally confirm images decode. Credits and page banner describe sample/reused illustrative photography rather than implying documentary evidence of the listed models. Corrected expression: index 5 uses `/preview/guitar-6.jpg` and its crop; all other entries use `/preview/guitar-7.jpg` and its crop.

Student evaluation/reasoning: **pending human input**. Decide whether this qualifies for Challenge 3. No customer feedback, human usability test or missing challenge examples are fabricated.
