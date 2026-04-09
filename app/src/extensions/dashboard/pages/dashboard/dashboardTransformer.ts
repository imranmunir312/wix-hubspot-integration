import type {
  DashboardSelectOption,
  HubspotPropertyOption,
  MappingDirection,
  MappingRow,
  MappingTransformType,
  SaveMappingsRequest,
  WixFieldOption,
} from "./dashboardTypes";

export const DIRECTION_OPTIONS: DashboardSelectOption<MappingDirection>[] = [
  {
    id: "wix_to_hubspot",
    value: "wix_to_hubspot",
    label: "Wix → HubSpot",
  },
  {
    id: "hubspot_to_wix",
    value: "hubspot_to_wix",
    label: "HubSpot → Wix",
  },
  {
    id: "bidirectional",
    value: "bidirectional",
    label: "Bi-directional",
  },
];

export const TRANSFORM_OPTIONS: DashboardSelectOption<MappingTransformType>[] = [
  { id: "none", value: "none", label: "None" },
  { id: "trim", value: "trim", label: "Trim" },
  { id: "lowercase", value: "lowercase", label: "Lowercase" },
];

export const createEmptyMappingRow = (): MappingRow => ({
  wixFieldKey: "",
  hubspotPropertyName: "",
  direction: "bidirectional",
  transformType: "none",
  defaultValue: "",
  isEnabled: true,
});

const createLabelMap = <TKey extends string>(
  items: Array<{ key: TKey; label: string }>,
) => new Map(items.map((item) => [item.key, item.label]));

export const toDashboardMappings = (
  mappings: Array<Partial<MappingRow>> | null | undefined,
): MappingRow[] => {
  if (!mappings || mappings.length === 0) {
    return [createEmptyMappingRow()];
  }

  return mappings.map((mapping) => ({
    wixFieldKey: mapping.wixFieldKey ?? "",
    hubspotPropertyName: mapping.hubspotPropertyName ?? "",
    direction: mapping.direction ?? "bidirectional",
    transformType: mapping.transformType ?? "none",
    defaultValue: mapping.defaultValue ?? "",
    isEnabled: mapping.isEnabled ?? true,
  }));
};

export const toWixFieldOptions = (
  wixFields: WixFieldOption[],
): DashboardSelectOption[] =>
  wixFields.map((field) => ({
    id: field.key,
    value: field.key,
    label: field.label,
  }));

export const toHubspotPropertyOptions = (
  hubspotProperties: HubspotPropertyOption[],
): DashboardSelectOption[] =>
  hubspotProperties.map((field) => ({
    id: field.name,
    value: field.name,
    label: field.label,
  }));

export const toWixFieldSearchValues = (
  mappings: MappingRow[],
  wixFields: WixFieldOption[],
) => {
  const wixFieldLabels = createLabelMap(
    wixFields.map((field) => ({ key: field.key, label: field.label })),
  );

  return mappings.map(
    (row) => wixFieldLabels.get(row.wixFieldKey) ?? row.wixFieldKey,
  );
};

export const toHubspotPropertySearchValues = (
  mappings: MappingRow[],
  hubspotProperties: HubspotPropertyOption[],
) => {
  const hubspotPropertyLabels = createLabelMap(
    hubspotProperties.map((field) => ({
      key: field.name,
      label: field.label,
    })),
  );

  return mappings.map(
    (row) =>
      hubspotPropertyLabels.get(row.hubspotPropertyName) ??
      row.hubspotPropertyName,
  );
};

export const toSaveMappingsRequest = (
  mappings: MappingRow[],
): SaveMappingsRequest => ({
  mappings: mappings.filter(
    (row) => row.wixFieldKey && row.hubspotPropertyName,
  ),
});
