export const STORAGE_KEY = "uni-chance-data";
export const STORAGE_VERSION = 4;

export const SCORE_RANGES = [
  { label: "396+", min: 396, max: Infinity },
  { label: "395–391", min: 391, max: 395 },
  { label: "390–386", min: 386, max: 390 },
  { label: "385–381", min: 381, max: 385 },
  { label: "380–376", min: 376, max: 380 },
  { label: "375–371", min: 371, max: 375 },
  { label: "370–366", min: 366, max: 370 },
  { label: "365–361", min: 361, max: 365 },
  { label: "360–356", min: 356, max: 360 },
  { label: "355–351", min: 351, max: 355 },
  { label: "350–346", min: 346, max: 350 },
  { label: "345–341", min: 341, max: 345 },
  { label: "340–336", min: 336, max: 340 },
  { label: "335–331", min: 331, max: 335 },
  { label: "330–326", min: 326, max: 330 },
  { label: "325–321", min: 321, max: 325 },
  { label: "320–316", min: 316, max: 320 },
  { label: "315–311", min: 311, max: 315 },
  { label: "310–306", min: 306, max: 310 },
  { label: "305–301", min: 301, max: 305 },
  { label: "300–296", min: 296, max: 300 },
  { label: "295–291", min: 291, max: 295 },
  { label: "290–286", min: 286, max: 290 },
  { label: "285–281", min: 281, max: 285 },
  { label: "280–276", min: 276, max: 280 },
  { label: "275–271", min: 271, max: 275 },
  { label: "270–266", min: 266, max: 270 },
  { label: "265–261", min: 261, max: 265 },
  { label: "260–256", min: 256, max: 260 },
  { label: "255–251", min: 251, max: 255 },
  { label: "250–246", min: 246, max: 250 },
  { label: "245–241", min: 241, max: 245 },
  { label: "240–236", min: 236, max: 240 },
  { label: "235–231", min: 231, max: 235 },
  { label: "230–226", min: 226, max: 230 },
  { label: "225–221", min: 221, max: 225 },
  { label: "220–216", min: 216, max: 220 },
  { label: "215–211", min: 211, max: 215 },
  { label: "210–206", min: 206, max: 210 },
  { label: "205–201", min: 201, max: 205 },
  { label: "200–196", min: 196, max: 200 },
  { label: "195–191", min: 191, max: 195 },
  { label: "190–186", min: 186, max: 190 },
  { label: "185–181", min: 181, max: 185 },
  { label: "180–176", min: 176, max: 180 },
  { label: "175–171", min: 171, max: 175 },
  { label: "170–166", min: 166, max: 170 },
  { label: "165–161", min: 161, max: 165 },
  { label: "160–156", min: 156, max: 160 },
  { label: "155–151", min: 151, max: 155 },
  { label: "150–146", min: 146, max: 150 },
  { label: "145–141", min: 141, max: 145 },
  { label: "140–136", min: 136, max: 140 },
  { label: "135–131", min: 131, max: 135 },
  { label: "130–126", min: 126, max: 130 },
  { label: "125–121", min: 121, max: 125 },
  { label: "120–116", min: 116, max: 120 },
  { label: "≤115", min: -Infinity, max: 115 }
];

export function newFaculty(idCounter) {
  return {
    id: ++idCounter,
    name: "",
    collapsed: false,
    specialties: []
  };
}

export function newSpecialty(idCounter) {
  return {
    id: ++idCounter,
    name: "",
    isTarget: false,
    isApplied: false,
    plan: 0,
    scoreDist: new Array(57).fill(0)
  };
}
