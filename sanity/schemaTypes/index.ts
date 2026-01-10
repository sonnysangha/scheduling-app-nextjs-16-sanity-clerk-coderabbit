import { type SchemaTypeDefinition } from "sanity";
import { userType } from "./userType";
import { availabilitySlotType } from "./availabilitySlotType";
import { connectedAccountType } from "./connectedAccountType";
import { bookingType } from "./bookingType";
import { meetingTypeType } from "./meetingTypeType";
import { feedbackType } from "./feedbackType";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    userType,
    availabilitySlotType,
    connectedAccountType,
    bookingType,
    meetingTypeType,
    feedbackType,
  ],
};
