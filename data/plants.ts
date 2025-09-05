import { Plant } from "types/plant"

// slug helper
const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

const defaults = {
  light: "medium" as const,
  water: "medium" as const,
  waterIntervalDays: 7,
  fertilizeIntervalDays: 45,
}

const p = (name: string, species: string, extra?: Partial<Plant>): Plant => ({
  id: slug(name),
  name,
  species,
  imageUrl: `https://picsum.photos/seed/${encodeURIComponent(slug(name))}/1200/600`,
  ...defaults,
  ...extra,
})

export const PLANTS: Plant[] = [
  p("Burgundy Rubber Plant", "Ficus elastica"),
  p("ZZ Plant", "Zamioculcas zamiifolia", { light: "low", water: "low", waterIntervalDays: 21 }),
  p("Aloe Vera", "Aloe barbadensis miller", { light: "bright", water: "low", waterIntervalDays: 14 }),
  p("Maranta Prayer Plant", "Maranta leuconeura", { light: "low", water: "medium" }),
  p("Rattlesnake Plant", "Calathea lancifolia", { light: "low", water: "high" }),
  p("Snake Plant", "Sansevieria trifasciata", { light: "low", water: "low", waterIntervalDays: 18 }),
  p("Fiddle Leaf Fig Tree", "Ficus lyrata", { light: "bright" }),
  p("Monstera Deliciosa", "Monstera deliciosa", { light: "medium" }),
  p("Key Lime Tree", "Citrus × aurantiifolia", { light: "bright", water: "high" }),
  p("Chinese Money Plant", "Pilea peperomioides", { light: "medium" }),
  p("Coffee", "Coffea arabica", { light: "medium", water: "high" }),
  p("Jade Plant", "Crassula ovata", { light: "bright", water: "low", waterIntervalDays: 14 }),
  p("Hilo Beauty", "Caladium praetermissum 'Hilo Beauty'", { light: "medium", water: "medium" }),
  p("Mammillaria - Irishman", "Mammillaria spinosissima", { light: "bright", water: "low", waterIntervalDays: 21 }),
  p("Golden Barrel Cactus", "Echinocactus grusonii", { light: "bright", water: "low", waterIntervalDays: 28 }),
  p("Christmas Cactus", "Schlumbergera truncata", { light: "medium", water: "medium" }),
  p("Blue Torch Column Cactus", "Pilosocereus pachycladus", { light: "bright", water: "low", waterIntervalDays: 21 }),
  p("Golden Pothos", "Epipremnum aureum", { light: "low", water: "medium", waterIntervalDays: 6 }),
  p("Bunny Ear Cactus white", "Opuntia microdasys var. albispina", { light: "bright", water: "low", waterIntervalDays: 21 }),
  p("Bunny Ear Cactus", "Opuntia microdasys", { light: "bright", water: "low", waterIntervalDays: 21 }),
  p("India Rubber Plant", "Ficus elastica"),
  p("Snake Plant Norma", "Sansevieria trifasciata", { light: "low", water: "low", waterIntervalDays: 18 }),
  p("Escobaria vivipara (Nutt.) Buxb.", "Escobaria vivipara", { light: "bright", water: "low", waterIntervalDays: 28 }),
  p("Hibiscus", "Hibiscus rosa-sinensis", { light: "bright", water: "high" }),
  p("Tuberous Begonia", "Begonia × tuberhybrida", { light: "medium", water: "medium" }),
  p("Lil Fiddle", "Ficus lyrata (dwarf variety)", { light: "bright" }),
  p("Bunny Ear Cactus IKEA", "Opuntia microdasys", { light: "bright", water: "low", waterIntervalDays: 21 }),
  p("Heart of Jesus", "Caladium bicolor", { light: "medium", water: "medium" }),
  p("Peace Lily", "Spathiphyllum wallisii", { light: "medium", water: "medium", waterIntervalDays: 5 }),
  p("Flowering Tobacco (Nicotiana)", "Nicotiana alata", { light: "bright", water: "high" }),
  p("Emory's Barrel Cactus", "Ferocactus emoryi", { light: "bright", water: "low", waterIntervalDays: 28 }),
  p("Neoraimondia herzogiana", "Neoraimondia herzogiana", { light: "bright", water: "low", waterIntervalDays: 28 }),
  p("Mammillaria disco", "Mammillaria discolor", { light: "bright", water: "low", waterIntervalDays: 28 }),
  p("Chinese Money Plant head", "Pilea peperomioides", { light: "medium" }),
  p("Philodendron Birkin", "Philodendron hederaceum var. ‘Birkin’", { light: "medium" }),
  p("Pink Princess Philodendron", "Philodendron erubescens ‘Pink Princess’", { light: "medium" }),
  p("Jade Plant (transfer)", "Crassula ovata", { light: "bright", water: "low", waterIntervalDays: 14 }),
  p("Hanging Wandering Jew", "Tradescantia zebrina", { light: "bright", water: "medium" }),
  p("Croton", "Codiaeum variegatum", { light: "bright", water: "medium" }),
  p("Kishu Mandarin", "Citrus reticulata ‘Kishu’", { light: "bright", water: "high" }),
  p("Rex Begonia prop", "Begonia rex-cultorum", { light: "medium", water: "medium" }),
  p("Elephant Ears", "Colocasia esculenta", { light: "medium", water: "high" }),
  p("Coffee black pot", "Coffea arabica", { light: "medium", water: "high" }),
  p("ZZ Prop", "Zamioculcas zamiifolia", { light: "low", water: "low", waterIntervalDays: 21 }),
  p("Lotus", "Nelumbo nucifera", { light: "bright", water: "high" }),
  p("Persian Shield", "Strobilanthes dyerianus", { light: "medium", water: "medium" }),
  p("Calathea Ornata", "Calathea ornata", { light: "low", water: "high" }),
  // Converted from previously pasted object literals
  p("Snake Plant Compacta", "Sansevieria hahnii", {
    light: "low",
    water: "low",
    description: "Rosette form; very low maintenance.",
    waterIntervalDays: 21,
    waterMl: 180,
    fertilizeIntervalDays: 90,
  }),
  p("Parlor Palm", "Chamaedorea elegans", {
    id: "palm-parlor",
    light: "low",
    water: "medium",
    description: "Classic indoor palm for low light.",
    imageUrl: "https://picsum.photos/seed/parlor-palm/1200/600",
    waterIntervalDays: 6,
    waterMl: 220,
    fertilizeIntervalDays: 60,
  }),
  p("Snake Plant Laurentii", "Sansevieria trifasciata 'Laurentii'", {
    light: "low",
    water: "low",
    description: "Yellow variegated edges.",
    waterIntervalDays: 18,
    waterMl: 200,
    fertilizeIntervalDays: 90,
  }),
  p("Golden Pothos", "Epipremnum aureum 'Golden'", {
    id: "pothos-golden",
    light: "low",
    water: "medium",
    description: "Fast-growing, forgiving vine with variegation.",
    imageUrl: "https://picsum.photos/seed/pothos-golden/1200/600",
    waterIntervalDays: 5,
    waterMl: 250,
    fertilizeIntervalDays: 45,
  }),
  p("Monstera", "Monstera deliciosa", {
    light: "medium",
    water: "medium",
    description:
      "Iconic split leaves; prefers bright, indirect light and moderate watering.",
    lastWateredAt: "2025-08-30",
  }),
  p("Pothos", "Epipremnum aureum", {
    light: "low",
    water: "medium",
    description: "Fast-growing vine great for shelves; very forgiving.",
  }),
]

export const getPlant = (id: string) => PLANTS.find((p) => p.id === id)
