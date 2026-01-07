import { type SchemaTypeDefinition } from "sanity";
import { userType } from "./userType";
import { availabilitySlotType } from "./availabilitySlotType";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [userType, availabilitySlotType],
};
