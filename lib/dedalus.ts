import Dedalus, { DedalusRunner } from "dedalus-labs";
import catalog from "@/data/catalog.json";
import type { Product, Address, GiftPairing } from "./types";

/**
 * Dedalus client instance for the ICBG application.
 * Handles authentication and request signing automatically.
 */
const client = new Dedalus({
  apiKey: process.env.DEDALUS_API_KEY!,
});

/**
 * DedalusRunner instance for orchestrating agent workflows.
 * Manages tool execution, MCP server communication, and
 * multi-turn conversations with the underlying LLM.
 */
const runner = new DedalusRunner(client);

/**
 * Mock product catalog typed as Product array.
 */
const mockCatalog: Product[] = catalog as Product[];

/**
 * Local tool function for querying the product catalog.
 * Dedalus SDK automatically extracts the function signature and
 * docstring to generate the tool schema for the LLM.
 *
 * @param category - Product category to filter ('toys', 'books', 'electronics', 'home', 'clothing')
 * @param ageRange - Target age range ('children', 'teen', 'adult', 'senior', 'all')
 * @returns Array of products matching the criteria
 */
function searchProducts(category: string, ageRange?: string): Product[] {
  return mockCatalog.filter((product) => {
    const categoryMatch = product.category === category;
    const ageMatch =
      !ageRange || product.ageRange === ageRange || product.ageRange === "all";
    return categoryMatch && ageMatch;
  });
}

/**
 * Builds the gift pairing prompt for the AI agent.
 *
 * @param addresses - Array of addresses with household metadata
 * @returns Formatted prompt string
 */
function buildGiftPairingPrompt(addresses: Address[]): string {
  return `
You are Santa's AI gift coordinator. For each household below, recommend 
an appropriate gift from the available catalog. Consider the household type,
whether children are present, and the estimated age demographics.

Use the searchProducts tool to find appropriate gifts. Available categories:
- toys (for children and teens)
- books (for all ages)
- electronics (gadgets and devices)
- home (home goods and decor)
- clothing (apparel and accessories)

Age ranges: children, teen, adult, senior, all

Households to process:
${addresses
  .map(
    (a) => `
- Address ID: ${a.id}
- Address: ${a.streetAddress}, ${a.city}, ${a.state} ${a.postalCode}
- Household Type: ${a.metadata?.householdType ?? "unknown"}
- Has Children: ${a.metadata?.hasChildren ?? "unknown"}
- Estimated Age: ${a.metadata?.estimatedAge ?? "unknown"}
`
  )
  .join("\n")}

For each household, provide your recommendation in the following JSON array format:
[
  { "addressId": "osm_...", "asin": "B0X001", "reason": "Brief explanation of why this gift fits" }
]

Return ONLY the JSON array, no other text.
`.trim();
}

/**
 * Parses the AI response into GiftPairing array.
 *
 * @param output - Raw output from the AI agent
 * @returns Array of gift pairings
 */
function parseGiftPairings(output: string): GiftPairing[] {
  // Extract JSON array from response
  const jsonMatch = output.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn("No JSON array found in AI response");
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed
      .map(
        (item: { addressId: string; asin: string; reason?: string }) => {
          const product = mockCatalog.find((p) => p.asin === item.asin);
          if (!product) {
            console.warn(`Product not found: ${item.asin}`);
            return null;
          }
          return {
            addressId: item.addressId,
            product,
            pairingReason: item.reason,
          };
        }
      )
      .filter(Boolean) as GiftPairing[];
  } catch (error) {
    console.error("Failed to parse gift pairings:", error);
    return [];
  }
}

/**
 * Generates gift recommendations for a list of addresses using AI,
 * leveraging the Dedalus Labs SDK with MCP server integration.
 *
 * @param addresses - Array of addresses with household metadata
 * @returns Promise resolving to AI-generated gift pairings
 */
export async function pairGiftsWithAI(
  addresses: Address[]
): Promise<GiftPairing[]> {
  const prompt = buildGiftPairingPrompt(addresses);

  try {
    const result = await runner.run({
      input: prompt,
      model: "openai/gpt-4o-mini",
      tools: [searchProducts],
      mcpServers: ["vroom08/agentmail-mcp"],
    });

    return parseGiftPairings(result.finalOutput);
  } catch (error) {
    console.error("AI gift pairing failed:", error);
    throw error;
  }
}

/**
 * Fallback gift pairing strategy when MCP server is unavailable.
 * Uses simple rule-based logic based on household metadata.
 *
 * @param address - Address with household metadata
 * @returns Product selected using rule-based logic
 */
export function fallbackGiftPairing(address: Address): Product {
  const { metadata } = address;

  // Prioritize children's gifts if children present
  if (metadata?.hasChildren) {
    const childToy = mockCatalog.find(
      (p) => p.category === "toys" && p.ageRange === "children"
    );
    if (childToy) return childToy;
  }

  // Senior-friendly gifts for elderly households
  if (metadata?.estimatedAge === "senior") {
    const seniorGift = mockCatalog.find(
      (p) => p.ageRange === "senior"
    );
    if (seniorGift) return seniorGift;
  }

  // Teen gifts for teen households
  if (metadata?.estimatedAge === "young") {
    const teenGift = mockCatalog.find(
      (p) => p.category === "electronics" && p.ageRange === "teen"
    );
    if (teenGift) return teenGift;
  }

  // Default: books are universally appreciated
  const defaultBook = mockCatalog.find((p) => p.category === "books");
  if (defaultBook) return defaultBook;

  // Ultimate fallback: first product in catalog
  return mockCatalog[0];
}

/**
 * Gets all products from the catalog.
 *
 * @returns Array of all products
 */
export function getAllProducts(): Product[] {
  return [...mockCatalog];
}

/**
 * Gets products by category.
 *
 * @param category - Product category to filter
 * @returns Array of products in the category
 */
export function getProductsByCategory(
  category: Product["category"]
): Product[] {
  return mockCatalog.filter((p) => p.category === category);
}

/**
 * Gets a product by its ASIN.
 *
 * @param asin - Product ASIN to find
 * @returns Product or undefined if not found
 */
export function getProductByAsin(asin: string): Product | undefined {
  return mockCatalog.find((p) => p.asin === asin);
}

export { mockCatalog };

