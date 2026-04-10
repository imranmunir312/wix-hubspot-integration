import { getIn, useFormik } from "formik";
import { useEffect, useMemo, useState } from "react";
import * as yup from "yup";
import type {
  DashboardFormValues,
  DashboardSelectOption,
  HubspotStatus,
  MappingRow,
} from "./dashboardTypes";
import { SYNC_DIRECTIONS, TRANSFORM_TYPES } from "./dashboardTypes";
import {
  createEmptyMappingRow,
  DIRECTION_OPTIONS,
  toDashboardMappings,
  toHubspotPropertyOptions,
  toHubspotPropertySearchValues,
  toSaveMappingsRequest,
  toWixFieldOptions,
  toWixFieldSearchValues,
  TRANSFORM_OPTIONS,
} from "./dashboardTransformer";
import { useDashboardApi } from "./useDashboardApi";
import { validationSchema } from "./mappings.validation";

const normalizeSearchValue = (value: unknown) =>
  value?.toString().trim().toLowerCase() ?? "";

const matchesSearch = (
  option: { label?: unknown; value?: unknown },
  searchValue: string,
) => {
  const normalizedSearchValue = normalizeSearchValue(searchValue);

  if (!normalizedSearchValue) {
    return true;
  }

  return [option.label, option.value].some((field) =>
    normalizeSearchValue(field).includes(normalizedSearchValue),
  );
};

export const useDashboardController = () => {
  const dashboardApi = useDashboardApi();

  const [status, setStatus] = useState<HubspotStatus | null>(null);
  const [initialMappings, setInitialMappings] = useState<MappingRow[]>([]);
  const [wixFieldOptions, setWixFieldOptions] = useState<
    DashboardSelectOption[]
  >([]);
  const [hubspotPropertyOptions, setHubspotPropertyOptions] = useState<
    DashboardSelectOption[]
  >([]);
  const [initialWixFieldSearchValues, setInitialWixFieldSearchValues] =
    useState<string[]>([]);
  const [
    initialHubspotPropertySearchValues,
    setInitialHubspotPropertySearchValues,
  ] = useState<string[]>([]);
  const [wixFieldSearchValues, setWixFieldSearchValues] = useState<string[]>(
    [],
  );
  const [hubspotPropertySearchValues, setHubspotPropertySearchValues] =
    useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialValues = useMemo<DashboardFormValues>(
    () => ({
      mappings: initialMappings,
    }),
    [initialMappings],
  );

  const handleSaveMappingsRequest = async (mappings: MappingRow[]) => {
    setSaving(true);

    try {
      await dashboardApi.saveMappings(toSaveMappingsRequest(mappings));
      await loadDashboard();
      alert("Mappings saved successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to save mappings");
    } finally {
      setSaving(false);
    }
  };

  const formik = useFormik<DashboardFormValues>({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      await handleSaveMappingsRequest(values.mappings);
    },
  });

  const loadDashboard = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [statusData, wixFieldData] = await Promise.all([
        dashboardApi.getHubspotStatus(),
        dashboardApi.getWixFields(),
      ]);

      const [hubspotPropertyData, mappingData] = await Promise.all([
        dashboardApi.getHubspotProperties(),
        dashboardApi.getMappings(),
      ]);

      const dashboardMappings = toDashboardMappings(mappingData);
      const nextWixFieldSearchValues = toWixFieldSearchValues(
        dashboardMappings,
        wixFieldData,
      );
      const nextHubspotPropertySearchValues = toHubspotPropertySearchValues(
        dashboardMappings,
        hubspotPropertyData,
      );

      setStatus(statusData);
      setInitialMappings(dashboardMappings);
      setWixFieldOptions(toWixFieldOptions(wixFieldData));
      setHubspotPropertyOptions(toHubspotPropertyOptions(hubspotPropertyData));
      setInitialWixFieldSearchValues(nextWixFieldSearchValues);
      setInitialHubspotPropertySearchValues(nextHubspotPropertySearchValues);
      setWixFieldSearchValues(nextWixFieldSearchValues);
      setHubspotPropertySearchValues(nextHubspotPropertySearchValues);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      setErrorMessage("Failed to load installation or HubSpot data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const updateSearchValue = (
    setter: typeof setWixFieldSearchValues,
    index: number,
    value: string,
  ) => {
    setter((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const updateMappingRow = <K extends keyof MappingRow>(
    index: number,
    key: K,
    value: MappingRow[K],
  ) => {
    void formik.setFieldValue(`mappings.${index}.${key}`, value);
    void formik.setFieldTouched(`mappings.${index}.${key}`, true, false);
  };

  const addMappingRow = () => {
    void formik.setFieldValue("mappings", [
      ...formik.values.mappings,
      createEmptyMappingRow(),
    ]);
    setWixFieldSearchValues((prev) => [...prev, ""]);
    setHubspotPropertySearchValues((prev) => [...prev, ""]);
  };

  const removeMappingRow = (index: number) => {
    const nextMappings = formik.values.mappings.filter(
      (_, rowIndex) => rowIndex !== index,
    );

    void formik.setFieldValue(
      "mappings",
      nextMappings.length > 0 ? nextMappings : [createEmptyMappingRow()],
    );

    setWixFieldSearchValues((prev) => {
      const next = prev.filter((_, rowIndex) => rowIndex !== index);
      return next.length > 0 ? next : [""];
    });

    setHubspotPropertySearchValues((prev) => {
      const next = prev.filter((_, rowIndex) => rowIndex !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const handleWixFieldSearchChange = (index: number, value: string) => {
    updateSearchValue(setWixFieldSearchValues, index, value);
  };

  const handleHubspotPropertySearchChange = (index: number, value: string) => {
    updateSearchValue(setHubspotPropertySearchValues, index, value);
  };

  const handleWixFieldSelect = (
    index: number,
    value: string,
    label: string,
  ) => {
    updateMappingRow(index, "wixFieldKey", value);
    updateSearchValue(setWixFieldSearchValues, index, label);
  };

  const handleHubspotPropertySelect = (
    index: number,
    value: string,
    label: string,
  ) => {
    updateMappingRow(index, "hubspotPropertyName", value);
    updateSearchValue(setHubspotPropertySearchValues, index, label);
  };

  const handleDirectionSelect = (
    index: number,
    direction: MappingRow["direction"],
  ) => {
    updateMappingRow(index, "direction", direction);
  };

  const handleTransformTypeSelect = (
    index: number,
    transformType: MappingRow["transformType"],
  ) => {
    updateMappingRow(index, "transformType", transformType);
  };

  const handleSaveMappings = () => formik.submitForm();

  const discardChanges = () => {
    formik.resetForm();
    setWixFieldSearchValues(initialWixFieldSearchValues);
    setHubspotPropertySearchValues(initialHubspotPropertySearchValues);
  };

  const getFieldError = (
    index: number,
    key: keyof MappingRow,
  ): string | undefined => {
    const fieldPath = `mappings.${index}.${key}`;
    const error = getIn(formik.errors, fieldPath);
    const touched = getIn(formik.touched, fieldPath);

    if (!error || (!touched && formik.submitCount === 0)) {
      return undefined;
    }

    return error as string;
  };

  const handleConnectHubspot = async () => {
    try {
      const authorizeUrl = await dashboardApi.getHubspotAuthorizeUrl();
      window.open(authorizeUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      alert("Failed to connect HubSpot");
    }
  };

  const handleDisconnectHubspot = async () => {
    try {
      await dashboardApi.disconnectHubspot();
      await loadDashboard();
    } catch (error) {
      console.error(error);
      alert("Failed to disconnect HubSpot");
    }
  };

  return {
    addMappingRow,
    directionOptions: DIRECTION_OPTIONS,
    discardChanges,
    errorMessage,
    getFieldError,
    handleConnectHubspot,
    handleDirectionSelect,
    handleDisconnectHubspot,
    handleHubspotPropertySearchChange,
    handleHubspotPropertySelect,
    handleSaveMappings,
    handleTransformTypeSelect,
    handleWixFieldSearchChange,
    handleWixFieldSelect,
    hubspotPropertyOptions,
    hubspotPropertySearchValues,
    isDirty: formik.dirty,
    loading,
    mappings: formik.values.mappings,
    mappingsError:
      typeof formik.errors.mappings === "string" && formik.submitCount > 0
        ? formik.errors.mappings
        : undefined,
    matchesSearch,
    refreshDashboard: loadDashboard,
    removeMappingRow,
    saving,
    status,
    transformOptions: TRANSFORM_OPTIONS,
    wixFieldOptions,
    wixFieldSearchValues,
  };
};
