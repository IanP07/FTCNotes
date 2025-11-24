"use client";

import { PinInput as ArkPinInput } from "@ark-ui/react";

export const PinInput = Object.assign(ArkPinInput.Root, {
  Group: ArkPinInput.Control,
  Slot: ArkPinInput.Input,
  Label: ArkPinInput.Label,
});
