import {
  getProfiles,
  patchProfile,
  patchProfilesConfig,
} from "@/services/cmds";
import useSWR, { mutate } from "swr";
import { updateProxy } from "@/services/api";
import { getProxies } from "@/services/cmds";
export const useProfiles = () => {
  const { data: profiles, mutate: mutateProfiles } = useSWR(
    "getProfiles",
    getProfiles,
  );

  const patchProfiles = async (value: Partial<IProfilesConfig>) => {
    await patchProfilesConfig(value);
    mutateProfiles();
  };

  const patchCurrent = async (value: Partial<IProfileItem>) => {
    if (profiles?.current) {
      await patchProfile(profiles.current, value);
      mutateProfiles();
    }
  };

  // 根据selected的节点选择
  const activateSelected = async () => {
    const proxiesData = await getProxies();
    const profileData = await getProfiles();

    if (!profileData || !proxiesData) return;

    const current = profileData.items?.find(
      (e) => e && e.uid === profileData.current,
    );

    if (!current) return;

    // init selected array
    const { selected = [] } = current;
    const selectedMap = Object.fromEntries(
      selected.map((each) => [each.name!, each.now!]),
    );

    let hasChange = false;

    const newSelected: typeof selected = [];
    const { global, groups } = proxiesData;

    const updates = [global, ...groups].flatMap(({ type, name, now }) => {
      if (!now || type !== "Selector") return [];

      const selectedNow = selectedMap[name];
      newSelected.push({ name, now: selectedNow ?? now });

      if (selectedNow != null && selectedNow !== now) {
        hasChange = true;
        return [updateProxy(name, selectedNow)];
      }

      return [];
    });

    if (hasChange) {
      await Promise.all(updates);
      await patchProfile(profileData.current!, { selected: newSelected });
      mutate("getProxies", getProxies());
    }
  };

  return {
    profiles,
    current: profiles?.items?.find((p) => p && p.uid === profiles.current),
    activateSelected,
    patchProfiles,
    patchCurrent,
    mutateProfiles,
  };
};
