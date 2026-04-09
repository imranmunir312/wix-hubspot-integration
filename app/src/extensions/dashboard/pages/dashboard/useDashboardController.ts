import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import type {
  DashboardSelectOption,
  HubspotStatus,
  MappingDirection,
  MappingRow,
  MappingTransformType,
} from "./dashboardTypes";
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

export const useDashboardController = () => {
  const dashboardApi = useDashboardApi();

  const [status, setStatus] = useState<HubspotStatus | null>(null);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [wixFieldOptions, setWixFieldOptions] = useState<DashboardSelectOption[]>(
    [],
  );
  const [hubspotPropertyOptions, setHubspotPropertyOptions] = useState<
    DashboardSelectOption[]
  >([]);
  const [wixFieldSearchValues, setWixFieldSearchValues] = useState<string[]>(
    [],
  );
  const [hubspotPropertySearchValues, setHubspotPropertySearchValues] =
    useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateSearchValue = (
    setter: Dispatch<SetStateAction<string[]>>,
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
    setMappings((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  };

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

      setStatus(statusData);
      setMappings(dashboardMappings);
      setWixFieldOptions(toWixFieldOptions(wixFieldData));
      setHubspotPropertyOptions(toHubspotPropertyOptions(hubspotPropertyData));
      setWixFieldSearchValues(
        toWixFieldSearchValues(dashboardMappings, wixFieldData),
      );
      setHubspotPropertySearchValues(
        toHubspotPropertySearchValues(dashboardMappings, hubspotPropertyData),
      );
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

  const addMappingRow = () => {
    setMappings((prev) => [...prev, createEmptyMappingRow()]);
    setWixFieldSearchValues((prev) => [...prev, ""]);
    setHubspotPropertySearchValues((prev) => [...prev, ""]);
  };

  const removeMappingRow = (index: number) => {
    setMappings((prev) => {
      const next = prev.filter((_, rowIndex) => rowIndex !== index);
      return next.length > 0 ? next : [createEmptyMappingRow()];
    });

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

  const handleHubspotPropertySearchChange = (
    index: number,
    value: string,
  ) => {
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
    direction: MappingDirection,
  ) => {
    updateMappingRow(index, "direction", direction);
  };

  const handleTransformTypeSelect = (
    index: number,
    transformType: MappingTransformType,
  ) => {
    updateMappingRow(index, "transformType", transformType);
  };

  const handleSaveMappings = async () => {
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
    directionOptions: DIRECTION_OPTIONS,
    errorMessage,
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
    loading,
    mappings,
    refreshDashboard: loadDashboard,
    removeMappingRow,
    saving,
    status,
    transformOptions: TRANSFORM_OPTIONS,
    wixFieldOptions,
    wixFieldSearchValues,
    addMappingRow,
  };
};
