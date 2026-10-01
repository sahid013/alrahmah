/**
 * Countries for the donation form: ISO 3166-1 alpha-2 codes (inhabited territories), named with
 * the browser's/Node's Intl data. The United Kingdom is listed first.
 */
const CODES =
  'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(
    ' ',
  );

export const COUNTRY_CODES = new Set(CODES);
export const UK = 'GB';

const names = new Intl.DisplayNames(['en-GB'], { type: 'region' });
export const countryName = (code: string) => names.of(code) ?? code;

/** [code, name] pairs: United Kingdom first, then A–Z. */
export const COUNTRY_OPTIONS: [string, string][] = [
  [UK, countryName(UK)],
  ...CODES.filter((c) => c !== UK)
    .map((c): [string, string] => [c, countryName(c)])
    .sort((a, b) => a[1].localeCompare(b[1], 'en-GB')),
];
