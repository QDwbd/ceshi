import { useClashInfo } from "@/hooks/use-clash";
import { useVerge } from "@/hooks/use-verge";
import { useVisibility } from "@/hooks/use-visibility";
import { useWebsocket } from "@/hooks/use-websocket";
import parseTraffic from "@/utils/parse-traffic";
import {
  ArrowDownward,
  ArrowUpward,
  MemoryOutlined,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { TrafficGraph, type TrafficRef } from "./traffic-graph";
import { useLogSetup } from "./use-log-setup";

// setup the traffic
export const LayoutTraffic = () => {
  const { clashInfo } = useClashInfo();
  const { verge } = useVerge();

  // whether hide traffic graph
  const trafficGraph = verge?.traffic_graph ?? true;

  const trafficRef = useRef<TrafficRef>(null);
  const [traffic, setTraffic] = useState({ up: 0, down: 0 });
  const [memory, setMemory] = useState({ inuse: 0 });
  const pageVisible = useVisibility();

  // setup log ws during layout
  useLogSetup();

  const { connect, disconnect } = useWebsocket((event) => {
    const data = JSON.parse(event.data) as ITrafficItem;
    trafficRef.current?.appendData(data);
    setTraffic(data);
  });

  useEffect(() => {
    if (!clashInfo || !pageVisible) return;

    const { server = "", secret = "" } = clashInfo;
    connect(`ws://${server}/traffic?token=${encodeURIComponent(secret)}`);

    return () => {
      disconnect();
    };
  }, [clashInfo, pageVisible]);

  /* --------- meta memory information --------- */
  const isMetaCore =
    verge?.clash_core === "mihomo" || verge?.clash_core === "mihomo-alpha";
  const displayMemory = isMetaCore && (verge?.enable_memory_usage ?? true);

  const memoryWs = useWebsocket(
    (event) => {
      setMemory(JSON.parse(event.data));
    },
    { onError: () => setMemory({ inuse: 0 }) },
  );

  useEffect(() => {
    if (!clashInfo || !pageVisible || !displayMemory) return;
    const { server = "", secret = "" } = clashInfo;
    memoryWs.connect(
      `ws://${server}/memory?token=${encodeURIComponent(secret)}`,
    );
    return () => memoryWs.disconnect();
  }, [clashInfo, pageVisible, displayMemory]);

  const [up, upUnit] = parseTraffic(traffic.up);
  const [down, downUnit] = parseTraffic(traffic.down);
  const [inuse, inuseUnit] = parseTraffic(memory.inuse);

  const iconStyle: any = {
    sx: { fontSize: 13 },
  };

  const renderRow = (
    icon: ReactNode,
    val: string,
    unit: string,
    active: boolean,
    title?: string,
  ) => (
    <span title={title}>
      {icon}
      <b style={active ? { color: "var(--primary-main)" } : undefined}>
        {val}
      </b>
      {unit}/s
    </span>
  );

  return (
    <Box
      className="traffic-pill"
      onClick={() => trafficRef.current?.toggleStyle()}
    >
      {trafficGraph && pageVisible && (
        <div className="traffic__graph">
          <TrafficGraph ref={trafficRef} />
        </div>
      )}

      <Box className="traffic__text">
        {renderRow(
          <ArrowUpward {...iconStyle} />,
          up,
          upUnit,
          +up > 0,
          "Upload Speed",
        )}
        {renderRow(
          <ArrowDownward {...iconStyle} />,
          down,
          downUnit,
          +down > 0,
          "Download Speed",
        )}
        {displayMemory &&
          renderRow(
            <MemoryOutlined color="disabled" />,
            inuse,
            inuseUnit,
            false,
            "Memory Usage",
          )}
      </Box>
    </Box>
  );
};
