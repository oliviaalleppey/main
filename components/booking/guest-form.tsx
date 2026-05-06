'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateGuestDetails } from '@/app/book/actions';
import { ChevronDown, Loader2, Mail, MapPin, MessageSquare, User } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useRef, useState, useEffect } from 'react';

// ─── Country list ────────────────────────────────────────────────────────────
// Top countries for a Kerala resort listed first, then alphabetical rest
const COUNTRIES = [
    {
        "code": "IN",
        "dial": "+91",
        "flag": "🇮🇳",
        "name": "India"
    },
    {
        "code": "AF",
        "dial": "+93",
        "flag": "🇦🇫",
        "name": "Afghanistan"
    },
    {
        "code": "AX",
        "dial": "+35818",
        "flag": "🇦🇽",
        "name": "Åland Islands"
    },
    {
        "code": "AL",
        "dial": "+355",
        "flag": "🇦🇱",
        "name": "Albania"
    },
    {
        "code": "DZ",
        "dial": "+213",
        "flag": "🇩🇿",
        "name": "Algeria"
    },
    {
        "code": "AS",
        "dial": "+1684",
        "flag": "🇦🇸",
        "name": "American Samoa"
    },
    {
        "code": "AD",
        "dial": "+376",
        "flag": "🇦🇩",
        "name": "Andorra"
    },
    {
        "code": "AO",
        "dial": "+244",
        "flag": "🇦🇴",
        "name": "Angola"
    },
    {
        "code": "AI",
        "dial": "+1264",
        "flag": "🇦🇮",
        "name": "Anguilla"
    },
    {
        "code": "AG",
        "dial": "+1268",
        "flag": "🇦🇬",
        "name": "Antigua and Barbuda"
    },
    {
        "code": "AR",
        "dial": "+54",
        "flag": "🇦🇷",
        "name": "Argentina"
    },
    {
        "code": "AM",
        "dial": "+374",
        "flag": "🇦🇲",
        "name": "Armenia"
    },
    {
        "code": "AW",
        "dial": "+297",
        "flag": "🇦🇼",
        "name": "Aruba"
    },
    {
        "code": "AU",
        "dial": "+61",
        "flag": "🇦🇺",
        "name": "Australia"
    },
    {
        "code": "AT",
        "dial": "+43",
        "flag": "🇦🇹",
        "name": "Austria"
    },
    {
        "code": "AZ",
        "dial": "+994",
        "flag": "🇦🇿",
        "name": "Azerbaijan"
    },
    {
        "code": "BS",
        "dial": "+1242",
        "flag": "🇧🇸",
        "name": "Bahamas"
    },
    {
        "code": "BH",
        "dial": "+973",
        "flag": "🇧🇭",
        "name": "Bahrain"
    },
    {
        "code": "BD",
        "dial": "+880",
        "flag": "🇧🇩",
        "name": "Bangladesh"
    },
    {
        "code": "BB",
        "dial": "+1246",
        "flag": "🇧🇧",
        "name": "Barbados"
    },
    {
        "code": "BY",
        "dial": "+375",
        "flag": "🇧🇾",
        "name": "Belarus"
    },
    {
        "code": "BE",
        "dial": "+32",
        "flag": "🇧🇪",
        "name": "Belgium"
    },
    {
        "code": "BZ",
        "dial": "+501",
        "flag": "🇧🇿",
        "name": "Belize"
    },
    {
        "code": "BJ",
        "dial": "+229",
        "flag": "🇧🇯",
        "name": "Benin"
    },
    {
        "code": "BM",
        "dial": "+1441",
        "flag": "🇧🇲",
        "name": "Bermuda"
    },
    {
        "code": "BT",
        "dial": "+975",
        "flag": "🇧🇹",
        "name": "Bhutan"
    },
    {
        "code": "BO",
        "dial": "+591",
        "flag": "🇧🇴",
        "name": "Bolivia"
    },
    {
        "code": "BA",
        "dial": "+387",
        "flag": "🇧🇦",
        "name": "Bosnia and Herzegovina"
    },
    {
        "code": "BW",
        "dial": "+267",
        "flag": "🇧🇼",
        "name": "Botswana"
    },
    {
        "code": "BV",
        "dial": "+47",
        "flag": "🇧🇻",
        "name": "Bouvet Island"
    },
    {
        "code": "BR",
        "dial": "+55",
        "flag": "🇧🇷",
        "name": "Brazil"
    },
    {
        "code": "IO",
        "dial": "+246",
        "flag": "🇮🇴",
        "name": "British Indian Ocean Territory"
    },
    {
        "code": "VG",
        "dial": "+1284",
        "flag": "🇻🇬",
        "name": "British Virgin Islands"
    },
    {
        "code": "BN",
        "dial": "+673",
        "flag": "🇧🇳",
        "name": "Brunei"
    },
    {
        "code": "BG",
        "dial": "+359",
        "flag": "🇧🇬",
        "name": "Bulgaria"
    },
    {
        "code": "BF",
        "dial": "+226",
        "flag": "🇧🇫",
        "name": "Burkina Faso"
    },
    {
        "code": "BI",
        "dial": "+257",
        "flag": "🇧🇮",
        "name": "Burundi"
    },
    {
        "code": "KH",
        "dial": "+855",
        "flag": "🇰🇭",
        "name": "Cambodia"
    },
    {
        "code": "CM",
        "dial": "+237",
        "flag": "🇨🇲",
        "name": "Cameroon"
    },
    {
        "code": "CA",
        "dial": "+1",
        "flag": "🇨🇦",
        "name": "Canada"
    },
    {
        "code": "CV",
        "dial": "+238",
        "flag": "🇨🇻",
        "name": "Cape Verde"
    },
    {
        "code": "BQ",
        "dial": "+599",
        "flag": "🇧🇶",
        "name": "Caribbean Netherlands"
    },
    {
        "code": "KY",
        "dial": "+1345",
        "flag": "🇰🇾",
        "name": "Cayman Islands"
    },
    {
        "code": "CF",
        "dial": "+236",
        "flag": "🇨🇫",
        "name": "Central African Republic"
    },
    {
        "code": "TD",
        "dial": "+235",
        "flag": "🇹🇩",
        "name": "Chad"
    },
    {
        "code": "CL",
        "dial": "+56",
        "flag": "🇨🇱",
        "name": "Chile"
    },
    {
        "code": "CN",
        "dial": "+86",
        "flag": "🇨🇳",
        "name": "China"
    },
    {
        "code": "CX",
        "dial": "+61",
        "flag": "🇨🇽",
        "name": "Christmas Island"
    },
    {
        "code": "CC",
        "dial": "+61",
        "flag": "🇨🇨",
        "name": "Cocos (Keeling) Islands"
    },
    {
        "code": "CO",
        "dial": "+57",
        "flag": "🇨🇴",
        "name": "Colombia"
    },
    {
        "code": "KM",
        "dial": "+269",
        "flag": "🇰🇲",
        "name": "Comoros"
    },
    {
        "code": "CK",
        "dial": "+682",
        "flag": "🇨🇰",
        "name": "Cook Islands"
    },
    {
        "code": "CR",
        "dial": "+506",
        "flag": "🇨🇷",
        "name": "Costa Rica"
    },
    {
        "code": "HR",
        "dial": "+385",
        "flag": "🇭🇷",
        "name": "Croatia"
    },
    {
        "code": "CU",
        "dial": "+53",
        "flag": "🇨🇺",
        "name": "Cuba"
    },
    {
        "code": "CW",
        "dial": "+599",
        "flag": "🇨🇼",
        "name": "Curaçao"
    },
    {
        "code": "CY",
        "dial": "+357",
        "flag": "🇨🇾",
        "name": "Cyprus"
    },
    {
        "code": "CZ",
        "dial": "+420",
        "flag": "🇨🇿",
        "name": "Czechia"
    },
    {
        "code": "DK",
        "dial": "+45",
        "flag": "🇩🇰",
        "name": "Denmark"
    },
    {
        "code": "DJ",
        "dial": "+253",
        "flag": "🇩🇯",
        "name": "Djibouti"
    },
    {
        "code": "DM",
        "dial": "+1767",
        "flag": "🇩🇲",
        "name": "Dominica"
    },
    {
        "code": "DO",
        "dial": "+1",
        "flag": "🇩🇴",
        "name": "Dominican Republic"
    },
    {
        "code": "CD",
        "dial": "+243",
        "flag": "🇨🇩",
        "name": "DR Congo"
    },
    {
        "code": "EC",
        "dial": "+593",
        "flag": "🇪🇨",
        "name": "Ecuador"
    },
    {
        "code": "EG",
        "dial": "+20",
        "flag": "🇪🇬",
        "name": "Egypt"
    },
    {
        "code": "SV",
        "dial": "+503",
        "flag": "🇸🇻",
        "name": "El Salvador"
    },
    {
        "code": "GQ",
        "dial": "+240",
        "flag": "🇬🇶",
        "name": "Equatorial Guinea"
    },
    {
        "code": "ER",
        "dial": "+291",
        "flag": "🇪🇷",
        "name": "Eritrea"
    },
    {
        "code": "EE",
        "dial": "+372",
        "flag": "🇪🇪",
        "name": "Estonia"
    },
    {
        "code": "SZ",
        "dial": "+268",
        "flag": "🇸🇿",
        "name": "Eswatini"
    },
    {
        "code": "ET",
        "dial": "+251",
        "flag": "🇪🇹",
        "name": "Ethiopia"
    },
    {
        "code": "FK",
        "dial": "+500",
        "flag": "🇫🇰",
        "name": "Falkland Islands"
    },
    {
        "code": "FO",
        "dial": "+298",
        "flag": "🇫🇴",
        "name": "Faroe Islands"
    },
    {
        "code": "FJ",
        "dial": "+679",
        "flag": "🇫🇯",
        "name": "Fiji"
    },
    {
        "code": "FI",
        "dial": "+358",
        "flag": "🇫🇮",
        "name": "Finland"
    },
    {
        "code": "FR",
        "dial": "+33",
        "flag": "🇫🇷",
        "name": "France"
    },
    {
        "code": "GF",
        "dial": "+594",
        "flag": "🇬🇫",
        "name": "French Guiana"
    },
    {
        "code": "PF",
        "dial": "+689",
        "flag": "🇵🇫",
        "name": "French Polynesia"
    },
    {
        "code": "TF",
        "dial": "+262",
        "flag": "🇹🇫",
        "name": "French Southern and Antarctic Lands"
    },
    {
        "code": "GA",
        "dial": "+241",
        "flag": "🇬🇦",
        "name": "Gabon"
    },
    {
        "code": "GM",
        "dial": "+220",
        "flag": "🇬🇲",
        "name": "Gambia"
    },
    {
        "code": "GE",
        "dial": "+995",
        "flag": "🇬🇪",
        "name": "Georgia"
    },
    {
        "code": "DE",
        "dial": "+49",
        "flag": "🇩🇪",
        "name": "Germany"
    },
    {
        "code": "GH",
        "dial": "+233",
        "flag": "🇬🇭",
        "name": "Ghana"
    },
    {
        "code": "GI",
        "dial": "+350",
        "flag": "🇬🇮",
        "name": "Gibraltar"
    },
    {
        "code": "GR",
        "dial": "+30",
        "flag": "🇬🇷",
        "name": "Greece"
    },
    {
        "code": "GL",
        "dial": "+299",
        "flag": "🇬🇱",
        "name": "Greenland"
    },
    {
        "code": "GD",
        "dial": "+1473",
        "flag": "🇬🇩",
        "name": "Grenada"
    },
    {
        "code": "GP",
        "dial": "+590",
        "flag": "🇬🇵",
        "name": "Guadeloupe"
    },
    {
        "code": "GU",
        "dial": "+1671",
        "flag": "🇬🇺",
        "name": "Guam"
    },
    {
        "code": "GT",
        "dial": "+502",
        "flag": "🇬🇹",
        "name": "Guatemala"
    },
    {
        "code": "GG",
        "dial": "+44",
        "flag": "🇬🇬",
        "name": "Guernsey"
    },
    {
        "code": "GN",
        "dial": "+224",
        "flag": "🇬🇳",
        "name": "Guinea"
    },
    {
        "code": "GW",
        "dial": "+245",
        "flag": "🇬🇼",
        "name": "Guinea-Bissau"
    },
    {
        "code": "GY",
        "dial": "+592",
        "flag": "🇬🇾",
        "name": "Guyana"
    },
    {
        "code": "HT",
        "dial": "+509",
        "flag": "🇭🇹",
        "name": "Haiti"
    },
    {
        "code": "HN",
        "dial": "+504",
        "flag": "🇭🇳",
        "name": "Honduras"
    },
    {
        "code": "HK",
        "dial": "+852",
        "flag": "🇭🇰",
        "name": "Hong Kong"
    },
    {
        "code": "HU",
        "dial": "+36",
        "flag": "🇭🇺",
        "name": "Hungary"
    },
    {
        "code": "IS",
        "dial": "+354",
        "flag": "🇮🇸",
        "name": "Iceland"
    },
    {
        "code": "ID",
        "dial": "+62",
        "flag": "🇮🇩",
        "name": "Indonesia"
    },
    {
        "code": "IR",
        "dial": "+98",
        "flag": "🇮🇷",
        "name": "Iran"
    },
    {
        "code": "IQ",
        "dial": "+964",
        "flag": "🇮🇶",
        "name": "Iraq"
    },
    {
        "code": "IE",
        "dial": "+353",
        "flag": "🇮🇪",
        "name": "Ireland"
    },
    {
        "code": "IM",
        "dial": "+44",
        "flag": "🇮🇲",
        "name": "Isle of Man"
    },
    {
        "code": "IL",
        "dial": "+972",
        "flag": "🇮🇱",
        "name": "Israel"
    },
    {
        "code": "IT",
        "dial": "+39",
        "flag": "🇮🇹",
        "name": "Italy"
    },
    {
        "code": "CI",
        "dial": "+225",
        "flag": "🇨🇮",
        "name": "Ivory Coast"
    },
    {
        "code": "JM",
        "dial": "+1",
        "flag": "🇯🇲",
        "name": "Jamaica"
    },
    {
        "code": "JP",
        "dial": "+81",
        "flag": "🇯🇵",
        "name": "Japan"
    },
    {
        "code": "JE",
        "dial": "+44",
        "flag": "🇯🇪",
        "name": "Jersey"
    },
    {
        "code": "JO",
        "dial": "+962",
        "flag": "🇯🇴",
        "name": "Jordan"
    },
    {
        "code": "KZ",
        "dial": "+7",
        "flag": "🇰🇿",
        "name": "Kazakhstan"
    },
    {
        "code": "KE",
        "dial": "+254",
        "flag": "🇰🇪",
        "name": "Kenya"
    },
    {
        "code": "KI",
        "dial": "+686",
        "flag": "🇰🇮",
        "name": "Kiribati"
    },
    {
        "code": "XK",
        "dial": "+383",
        "flag": "🇽🇰",
        "name": "Kosovo"
    },
    {
        "code": "KW",
        "dial": "+965",
        "flag": "🇰🇼",
        "name": "Kuwait"
    },
    {
        "code": "KG",
        "dial": "+996",
        "flag": "🇰🇬",
        "name": "Kyrgyzstan"
    },
    {
        "code": "LA",
        "dial": "+856",
        "flag": "🇱🇦",
        "name": "Laos"
    },
    {
        "code": "LV",
        "dial": "+371",
        "flag": "🇱🇻",
        "name": "Latvia"
    },
    {
        "code": "LB",
        "dial": "+961",
        "flag": "🇱🇧",
        "name": "Lebanon"
    },
    {
        "code": "LS",
        "dial": "+266",
        "flag": "🇱🇸",
        "name": "Lesotho"
    },
    {
        "code": "LR",
        "dial": "+231",
        "flag": "🇱🇷",
        "name": "Liberia"
    },
    {
        "code": "LY",
        "dial": "+218",
        "flag": "🇱🇾",
        "name": "Libya"
    },
    {
        "code": "LI",
        "dial": "+423",
        "flag": "🇱🇮",
        "name": "Liechtenstein"
    },
    {
        "code": "LT",
        "dial": "+370",
        "flag": "🇱🇹",
        "name": "Lithuania"
    },
    {
        "code": "LU",
        "dial": "+352",
        "flag": "🇱🇺",
        "name": "Luxembourg"
    },
    {
        "code": "MO",
        "dial": "+853",
        "flag": "🇲🇴",
        "name": "Macau"
    },
    {
        "code": "MG",
        "dial": "+261",
        "flag": "🇲🇬",
        "name": "Madagascar"
    },
    {
        "code": "MW",
        "dial": "+265",
        "flag": "🇲🇼",
        "name": "Malawi"
    },
    {
        "code": "MY",
        "dial": "+60",
        "flag": "🇲🇾",
        "name": "Malaysia"
    },
    {
        "code": "MV",
        "dial": "+960",
        "flag": "🇲🇻",
        "name": "Maldives"
    },
    {
        "code": "ML",
        "dial": "+223",
        "flag": "🇲🇱",
        "name": "Mali"
    },
    {
        "code": "MT",
        "dial": "+356",
        "flag": "🇲🇹",
        "name": "Malta"
    },
    {
        "code": "MH",
        "dial": "+692",
        "flag": "🇲🇭",
        "name": "Marshall Islands"
    },
    {
        "code": "MQ",
        "dial": "+596",
        "flag": "🇲🇶",
        "name": "Martinique"
    },
    {
        "code": "MR",
        "dial": "+222",
        "flag": "🇲🇷",
        "name": "Mauritania"
    },
    {
        "code": "MU",
        "dial": "+230",
        "flag": "🇲🇺",
        "name": "Mauritius"
    },
    {
        "code": "YT",
        "dial": "+262",
        "flag": "🇾🇹",
        "name": "Mayotte"
    },
    {
        "code": "MX",
        "dial": "+52",
        "flag": "🇲🇽",
        "name": "Mexico"
    },
    {
        "code": "FM",
        "dial": "+691",
        "flag": "🇫🇲",
        "name": "Micronesia"
    },
    {
        "code": "MD",
        "dial": "+373",
        "flag": "🇲🇩",
        "name": "Moldova"
    },
    {
        "code": "MC",
        "dial": "+377",
        "flag": "🇲🇨",
        "name": "Monaco"
    },
    {
        "code": "MN",
        "dial": "+976",
        "flag": "🇲🇳",
        "name": "Mongolia"
    },
    {
        "code": "ME",
        "dial": "+382",
        "flag": "🇲🇪",
        "name": "Montenegro"
    },
    {
        "code": "MS",
        "dial": "+1664",
        "flag": "🇲🇸",
        "name": "Montserrat"
    },
    {
        "code": "MA",
        "dial": "+212",
        "flag": "🇲🇦",
        "name": "Morocco"
    },
    {
        "code": "MZ",
        "dial": "+258",
        "flag": "🇲🇿",
        "name": "Mozambique"
    },
    {
        "code": "MM",
        "dial": "+95",
        "flag": "🇲🇲",
        "name": "Myanmar"
    },
    {
        "code": "NA",
        "dial": "+264",
        "flag": "🇳🇦",
        "name": "Namibia"
    },
    {
        "code": "NR",
        "dial": "+674",
        "flag": "🇳🇷",
        "name": "Nauru"
    },
    {
        "code": "NP",
        "dial": "+977",
        "flag": "🇳🇵",
        "name": "Nepal"
    },
    {
        "code": "NL",
        "dial": "+31",
        "flag": "🇳🇱",
        "name": "Netherlands"
    },
    {
        "code": "NC",
        "dial": "+687",
        "flag": "🇳🇨",
        "name": "New Caledonia"
    },
    {
        "code": "NZ",
        "dial": "+64",
        "flag": "🇳🇿",
        "name": "New Zealand"
    },
    {
        "code": "NI",
        "dial": "+505",
        "flag": "🇳🇮",
        "name": "Nicaragua"
    },
    {
        "code": "NE",
        "dial": "+227",
        "flag": "🇳🇪",
        "name": "Niger"
    },
    {
        "code": "NG",
        "dial": "+234",
        "flag": "🇳🇬",
        "name": "Nigeria"
    },
    {
        "code": "NU",
        "dial": "+683",
        "flag": "🇳🇺",
        "name": "Niue"
    },
    {
        "code": "NF",
        "dial": "+672",
        "flag": "🇳🇫",
        "name": "Norfolk Island"
    },
    {
        "code": "KP",
        "dial": "+850",
        "flag": "🇰🇵",
        "name": "North Korea"
    },
    {
        "code": "MK",
        "dial": "+389",
        "flag": "🇲🇰",
        "name": "North Macedonia"
    },
    {
        "code": "MP",
        "dial": "+1670",
        "flag": "🇲🇵",
        "name": "Northern Mariana Islands"
    },
    {
        "code": "NO",
        "dial": "+47",
        "flag": "🇳🇴",
        "name": "Norway"
    },
    {
        "code": "OM",
        "dial": "+968",
        "flag": "🇴🇲",
        "name": "Oman"
    },
    {
        "code": "PK",
        "dial": "+92",
        "flag": "🇵🇰",
        "name": "Pakistan"
    },
    {
        "code": "PW",
        "dial": "+680",
        "flag": "🇵🇼",
        "name": "Palau"
    },
    {
        "code": "PS",
        "dial": "+970",
        "flag": "🇵🇸",
        "name": "Palestine"
    },
    {
        "code": "PA",
        "dial": "+507",
        "flag": "🇵🇦",
        "name": "Panama"
    },
    {
        "code": "PG",
        "dial": "+675",
        "flag": "🇵🇬",
        "name": "Papua New Guinea"
    },
    {
        "code": "PY",
        "dial": "+595",
        "flag": "🇵🇾",
        "name": "Paraguay"
    },
    {
        "code": "PE",
        "dial": "+51",
        "flag": "🇵🇪",
        "name": "Peru"
    },
    {
        "code": "PH",
        "dial": "+63",
        "flag": "🇵🇭",
        "name": "Philippines"
    },
    {
        "code": "PN",
        "dial": "+64",
        "flag": "🇵🇳",
        "name": "Pitcairn Islands"
    },
    {
        "code": "PL",
        "dial": "+48",
        "flag": "🇵🇱",
        "name": "Poland"
    },
    {
        "code": "PT",
        "dial": "+351",
        "flag": "🇵🇹",
        "name": "Portugal"
    },
    {
        "code": "PR",
        "dial": "+1",
        "flag": "🇵🇷",
        "name": "Puerto Rico"
    },
    {
        "code": "QA",
        "dial": "+974",
        "flag": "🇶🇦",
        "name": "Qatar"
    },
    {
        "code": "CG",
        "dial": "+242",
        "flag": "🇨🇬",
        "name": "Republic of the Congo"
    },
    {
        "code": "RE",
        "dial": "+262",
        "flag": "🇷🇪",
        "name": "Réunion"
    },
    {
        "code": "RO",
        "dial": "+40",
        "flag": "🇷🇴",
        "name": "Romania"
    },
    {
        "code": "RU",
        "dial": "+7",
        "flag": "🇷🇺",
        "name": "Russia"
    },
    {
        "code": "RW",
        "dial": "+250",
        "flag": "🇷🇼",
        "name": "Rwanda"
    },
    {
        "code": "BL",
        "dial": "+590",
        "flag": "🇧🇱",
        "name": "Saint Barthélemy"
    },
    {
        "code": "SH",
        "dial": "+2",
        "flag": "🇸🇭",
        "name": "Saint Helena, Ascension and Tristan da Cunha"
    },
    {
        "code": "KN",
        "dial": "+1869",
        "flag": "🇰🇳",
        "name": "Saint Kitts and Nevis"
    },
    {
        "code": "LC",
        "dial": "+1758",
        "flag": "🇱🇨",
        "name": "Saint Lucia"
    },
    {
        "code": "MF",
        "dial": "+590",
        "flag": "🇲🇫",
        "name": "Saint Martin"
    },
    {
        "code": "PM",
        "dial": "+508",
        "flag": "🇵🇲",
        "name": "Saint Pierre and Miquelon"
    },
    {
        "code": "VC",
        "dial": "+1784",
        "flag": "🇻🇨",
        "name": "Saint Vincent and the Grenadines"
    },
    {
        "code": "WS",
        "dial": "+685",
        "flag": "🇼🇸",
        "name": "Samoa"
    },
    {
        "code": "SM",
        "dial": "+378",
        "flag": "🇸🇲",
        "name": "San Marino"
    },
    {
        "code": "ST",
        "dial": "+239",
        "flag": "🇸🇹",
        "name": "São Tomé and Príncipe"
    },
    {
        "code": "SA",
        "dial": "+966",
        "flag": "🇸🇦",
        "name": "Saudi Arabia"
    },
    {
        "code": "SN",
        "dial": "+221",
        "flag": "🇸🇳",
        "name": "Senegal"
    },
    {
        "code": "RS",
        "dial": "+381",
        "flag": "🇷🇸",
        "name": "Serbia"
    },
    {
        "code": "SC",
        "dial": "+248",
        "flag": "🇸🇨",
        "name": "Seychelles"
    },
    {
        "code": "SL",
        "dial": "+232",
        "flag": "🇸🇱",
        "name": "Sierra Leone"
    },
    {
        "code": "SG",
        "dial": "+65",
        "flag": "🇸🇬",
        "name": "Singapore"
    },
    {
        "code": "SX",
        "dial": "+1721",
        "flag": "🇸🇽",
        "name": "Sint Maarten"
    },
    {
        "code": "SK",
        "dial": "+421",
        "flag": "🇸🇰",
        "name": "Slovakia"
    },
    {
        "code": "SI",
        "dial": "+386",
        "flag": "🇸🇮",
        "name": "Slovenia"
    },
    {
        "code": "SB",
        "dial": "+677",
        "flag": "🇸🇧",
        "name": "Solomon Islands"
    },
    {
        "code": "SO",
        "dial": "+252",
        "flag": "🇸🇴",
        "name": "Somalia"
    },
    {
        "code": "ZA",
        "dial": "+27",
        "flag": "🇿🇦",
        "name": "South Africa"
    },
    {
        "code": "GS",
        "dial": "+500",
        "flag": "🇬🇸",
        "name": "South Georgia"
    },
    {
        "code": "KR",
        "dial": "+82",
        "flag": "🇰🇷",
        "name": "South Korea"
    },
    {
        "code": "SS",
        "dial": "+211",
        "flag": "🇸🇸",
        "name": "South Sudan"
    },
    {
        "code": "ES",
        "dial": "+34",
        "flag": "🇪🇸",
        "name": "Spain"
    },
    {
        "code": "LK",
        "dial": "+94",
        "flag": "🇱🇰",
        "name": "Sri Lanka"
    },
    {
        "code": "SD",
        "dial": "+249",
        "flag": "🇸🇩",
        "name": "Sudan"
    },
    {
        "code": "SR",
        "dial": "+597",
        "flag": "🇸🇷",
        "name": "Suriname"
    },
    {
        "code": "SJ",
        "dial": "+4779",
        "flag": "🇸🇯",
        "name": "Svalbard and Jan Mayen"
    },
    {
        "code": "SE",
        "dial": "+46",
        "flag": "🇸🇪",
        "name": "Sweden"
    },
    {
        "code": "CH",
        "dial": "+41",
        "flag": "🇨🇭",
        "name": "Switzerland"
    },
    {
        "code": "SY",
        "dial": "+963",
        "flag": "🇸🇾",
        "name": "Syria"
    },
    {
        "code": "TW",
        "dial": "+886",
        "flag": "🇹🇼",
        "name": "Taiwan"
    },
    {
        "code": "TJ",
        "dial": "+992",
        "flag": "🇹🇯",
        "name": "Tajikistan"
    },
    {
        "code": "TZ",
        "dial": "+255",
        "flag": "🇹🇿",
        "name": "Tanzania"
    },
    {
        "code": "TH",
        "dial": "+66",
        "flag": "🇹🇭",
        "name": "Thailand"
    },
    {
        "code": "TL",
        "dial": "+670",
        "flag": "🇹🇱",
        "name": "Timor-Leste"
    },
    {
        "code": "TG",
        "dial": "+228",
        "flag": "🇹🇬",
        "name": "Togo"
    },
    {
        "code": "TK",
        "dial": "+690",
        "flag": "🇹🇰",
        "name": "Tokelau"
    },
    {
        "code": "TO",
        "dial": "+676",
        "flag": "🇹🇴",
        "name": "Tonga"
    },
    {
        "code": "TT",
        "dial": "+1868",
        "flag": "🇹🇹",
        "name": "Trinidad and Tobago"
    },
    {
        "code": "TN",
        "dial": "+216",
        "flag": "🇹🇳",
        "name": "Tunisia"
    },
    {
        "code": "TR",
        "dial": "+90",
        "flag": "🇹🇷",
        "name": "Turkey"
    },
    {
        "code": "TM",
        "dial": "+993",
        "flag": "🇹🇲",
        "name": "Turkmenistan"
    },
    {
        "code": "TC",
        "dial": "+1649",
        "flag": "🇹🇨",
        "name": "Turks and Caicos Islands"
    },
    {
        "code": "TV",
        "dial": "+688",
        "flag": "🇹🇻",
        "name": "Tuvalu"
    },
    {
        "code": "UG",
        "dial": "+256",
        "flag": "🇺🇬",
        "name": "Uganda"
    },
    {
        "code": "UA",
        "dial": "+380",
        "flag": "🇺🇦",
        "name": "Ukraine"
    },
    {
        "code": "AE",
        "dial": "+971",
        "flag": "🇦🇪",
        "name": "United Arab Emirates"
    },
    {
        "code": "GB",
        "dial": "+44",
        "flag": "🇬🇧",
        "name": "United Kingdom"
    },
    {
        "code": "US",
        "dial": "+1",
        "flag": "🇺🇸",
        "name": "United States"
    },
    {
        "code": "UM",
        "dial": "+268",
        "flag": "🇺🇲",
        "name": "United States Minor Outlying Islands"
    },
    {
        "code": "VI",
        "dial": "+1340",
        "flag": "🇻🇮",
        "name": "United States Virgin Islands"
    },
    {
        "code": "UY",
        "dial": "+598",
        "flag": "🇺🇾",
        "name": "Uruguay"
    },
    {
        "code": "UZ",
        "dial": "+998",
        "flag": "🇺🇿",
        "name": "Uzbekistan"
    },
    {
        "code": "VU",
        "dial": "+678",
        "flag": "🇻🇺",
        "name": "Vanuatu"
    },
    {
        "code": "VA",
        "dial": "+3",
        "flag": "🇻🇦",
        "name": "Vatican City"
    },
    {
        "code": "VE",
        "dial": "+58",
        "flag": "🇻🇪",
        "name": "Venezuela"
    },
    {
        "code": "VN",
        "dial": "+84",
        "flag": "🇻🇳",
        "name": "Vietnam"
    },
    {
        "code": "WF",
        "dial": "+681",
        "flag": "🇼🇫",
        "name": "Wallis and Futuna"
    },
    {
        "code": "EH",
        "dial": "+2",
        "flag": "🇪🇭",
        "name": "Western Sahara"
    },
    {
        "code": "YE",
        "dial": "+967",
        "flag": "🇾🇪",
        "name": "Yemen"
    },
    {
        "code": "ZM",
        "dial": "+260",
        "flag": "🇿🇲",
        "name": "Zambia"
    },
    {
        "code": "ZW",
        "dial": "+263",
        "flag": "🇿🇼",
        "name": "Zimbabwe"
    }
];


// ─── Types ───────────────────────────────────────────────────────────────────
type GuestFormValues = {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    requests?: string;
};

interface GuestFormProps {
    initialValues?: GuestFormValues;
    submitLabel?: string;
}

// ─── Submit button ───────────────────────────────────────────────────────────
function SubmitButton({ submitLabel }: { submitLabel: string }) {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[var(--brand-primary)] text-white py-3 md:py-4 text-sm font-semibold shadow-lg shadow-[var(--brand-primary)]/20 hover:bg-[var(--brand-primary-dark)] transition-colors"
        >
            {pending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {submitLabel}
        </Button>
    );
}

// ─── Validation ──────────────────────────────────────────────────────────────
function validateForm(data: FormData): Record<string, string> {
    const errors: Record<string, string> = {};

    const firstName = (data.get('firstName') as string || '').trim();
    const lastName  = (data.get('lastName')  as string || '').trim();
    const email     = (data.get('email')     as string || '').trim();
    const phone     = (data.get('phone')     as string || '').trim();

    if (!firstName) errors.firstName = 'First name is required';
    if (!lastName)  errors.lastName  = 'Last name is required';

    if (!email) {
        errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        errors.email = 'Enter a valid email address';
    }

    if (!phone) {
        errors.phone = 'Phone number is required';
    } else {
        // phone field will hold the full number e.g. "+49 151 23456789"
        // strip everything except digits and leading +
        const clean = phone.replace(/[\s\-().]/g, '');
        if (!/^\+\d{7,15}$/.test(clean)) {
            errors.phone = 'Enter a valid phone number';
        }
    }

    return errors;
}

// ─── Parse existing phone into dial + local ───────────────────────────────────
function parseInitialPhone(raw?: string): { dial: string; local: string } {
    if (!raw) return { dial: '+91', local: '' };
    const clean = raw.trim();
    // Try to match a known dial code
    for (const c of COUNTRIES) {
        if (clean.startsWith(c.dial)) {
            return { dial: c.dial, local: clean.slice(c.dial.length).replace(/^\s+/, '') };
        }
    }
    return { dial: '+91', local: clean };
}

// ─── Main component ───────────────────────────────────────────────────────────
export function GuestForm({
    initialValues,
    submitLabel = 'Save & Continue',
}: GuestFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const parsed = parseInitialPhone(initialValues?.phone);
    const [dialCode, setDialCode] = useState(parsed.dial);
    const [localNumber, setLocalNumber] = useState(parsed.local);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const filteredCountries = COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.dial.includes(searchQuery)
    );

    // Hidden field value — full combined number
    const fullPhone = `${dialCode} ${localNumber}`.trim();

    async function handleSubmit(formData: FormData) {
        // Inject the combined phone so validateForm sees it
        formData.set('phone', fullPhone);
        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        await updateGuestDetails(formData);
    }

    const selectedCountry = COUNTRIES.find(c => c.dial === dialCode) ?? COUNTRIES[0];

    return (
        <form ref={formRef} action={handleSubmit} className="space-y-3">
            {/* ── Primary Guest ── */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 md:p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-2 md:mb-3">Primary Guest</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative">
                            <User className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <Input
                                id="firstName"
                                name="firstName"
                                required
                                placeholder="John"
                                defaultValue={initialValues?.firstName || ''}
                                className={`h-9 rounded-lg bg-white pl-9 text-sm ${errors.firstName ? 'border-red-400 focus-visible:ring-red-400' : 'border-gray-300'}`}
                            />
                        </div>
                        {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="lastName">Last Name</Label>
                        <div className="relative">
                            <User className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <Input
                                id="lastName"
                                name="lastName"
                                required
                                placeholder="Doe"
                                defaultValue={initialValues?.lastName || ''}
                                className={`h-9 rounded-lg bg-white pl-9 text-sm ${errors.lastName ? 'border-red-400 focus-visible:ring-red-400' : 'border-gray-300'}`}
                            />
                        </div>
                        {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                    </div>
                </div>
            </div>

            {/* ── Contact Details ── */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 md:p-3">
                <div className="flex items-center justify-between gap-3 mb-2 md:mb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Contact Details</p>
                    <span className="text-[11px] text-gray-500">Used for confirmation and invoice</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    {/* Email */}
                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="john@example.com"
                                defaultValue={initialValues?.email || ''}
                                className={`h-9 rounded-lg bg-white pl-9 text-sm ${errors.email ? 'border-red-400 focus-visible:ring-red-400' : 'border-gray-300'}`}
                            />
                        </div>
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>

                    {/* Phone with country code selector */}
                    <div className="space-y-1.5">
                        <Label htmlFor="phoneLocal">Phone Number</Label>
                        {/* Hidden field carries the full combined value */}
                        <input type="hidden" name="phone" value={fullPhone} />
                        <div className={`flex h-9 rounded-lg bg-white border ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}>
                            {/* Custom Country Code Selector */}
                            <div className="relative flex-shrink-0" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDropdownOpen(!isDropdownOpen);
                                        setSearchQuery(''); // Reset search when opening
                                    }}
                                    className="flex items-center h-full bg-gray-50 border-r border-gray-300 pl-3 pr-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-l-lg"
                                >
                                    <span>{selectedCountry.flag} {selectedCountry.dial}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1.5" />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-[280px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Search country or code..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full h-8 px-3 text-sm rounded-md border border-gray-300 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                                            />
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {filteredCountries.length > 0 ? (
                                                filteredCountries.map(c => (
                                                    <button
                                                        key={c.code}
                                                        type="button"
                                                        onClick={() => {
                                                            setDialCode(c.dial);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className={`w-full flex items-center px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${dialCode === c.dial ? 'bg-gray-50 font-medium' : ''}`}
                                                    >
                                                        <span className="mr-3 text-lg">{c.flag}</span>
                                                        <span className="flex-1 text-sm text-gray-700">{c.name}</span>
                                                        <span className="text-sm text-gray-400">{c.dial}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-sm text-gray-500">
                                                    No countries found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Local number input */}
                            <input
                                id="phoneLocal"
                                type="tel"
                                inputMode="numeric"
                                placeholder={selectedCountry.code === 'IN' ? '98765 43210' : '151 23456789'}
                                value={localNumber}
                                onChange={e => setLocalNumber(e.target.value.replace(/[^\d\s\-]/g, ''))}
                                className="flex-1 min-w-0 px-2.5 text-sm bg-white focus:outline-none focus:ring-0 rounded-r-lg"
                            />
                        </div>
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                    </div>
                </div>
            </div>

            {/* ── Address ── */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 md:p-3">
                <Label htmlFor="address" className="inline-flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    Address <span className="text-gray-400 font-normal">(for invoice)</span>
                </Label>
                <Textarea
                    id="address"
                    name="address"
                    placeholder="House / Flat No., Street, City, State, PIN"
                    defaultValue={initialValues?.address || ''}
                    className="mt-1.5 min-h-[60px] rounded-lg border-gray-300 bg-white text-sm"
                />
            </div>

            {/* ── Special Requests ── */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 md:p-3">
                <Label htmlFor="requests" className="inline-flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    Special Requests (Optional)
                </Label>
                <Textarea
                    id="requests"
                    name="requests"
                    placeholder="Any check-in preferences, celebration setup, or dietary requirements?"
                    defaultValue={initialValues?.requests || ''}
                    className="mt-1.5 min-h-[70px] rounded-lg border-gray-300 bg-white text-sm"
                />
                <p className="text-[11px] text-gray-500 mt-1.5">
                    Requests are subject to availability and confirmed at check-in.
                </p>
            </div>

            <SubmitButton submitLabel={submitLabel} />
        </form>
    );
}
