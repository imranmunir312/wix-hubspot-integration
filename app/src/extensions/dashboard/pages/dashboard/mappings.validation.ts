import * as yup from "yup";
import {
  SYNC_DIRECTIONS,
  TRANSFORM_TYPES,
  type DashboardFormValues,
  type MappingRow,
} from "./dashboardTypes";

const mappingValidationSchema: yup.ObjectSchema<MappingRow> = yup.object({
  wixFieldKey: yup.string().trim().required("Select a Wix field"),
  hubspotPropertyName: yup.string().trim().required("Select a HubSpot field"),
  direction: yup
    .mixed<MappingRow["direction"]>()
    .oneOf([...SYNC_DIRECTIONS])
    .required("Select a sync type"),
  transformType: yup
    .mixed<MappingRow["transformType"]>()
    .oneOf([...TRANSFORM_TYPES])
    .required("Select a conflict rule"),
  defaultValue: yup.string().optional(),
  isEnabled: yup.boolean().optional(),
});

export const validationSchema: yup.ObjectSchema<DashboardFormValues> =
  yup.object({
    mappings: yup
      .array()
      .of(mappingValidationSchema)
      .min(1, "Add at least one mapping")
      .required(),
  });
