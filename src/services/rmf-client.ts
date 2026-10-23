import axios, { AxiosInstance } from 'axios';
import { io, Socket } from 'socket.io-client';
import {
  BuildingMap,
  FleetState,
  TaskState,
  DoorState,
  LiftState,
  Door,
  Lift,
  TaskLogEntry,
  RobotState,
  WorkcellItem,
} from '../types/rmf';

const DEFAULT_API_URL =
  import.meta.env.VITE_RMF_API_SERVER_URL || 'https://rmf-api.qshudev.cloud';
const DEFAULT_TRAJECTORY_URL =
  import.meta.env.VITE_RMF_TRAJECTORY_SERVER_URL || 'wss://rmf-api.qshudev.cloud/trajectory';

export class RmfClient {
  private apiServerUrl: string;
  private trajectoryServerUrl: string;
  private http: AxiosInstance;
  private sio: Socket | null = null;
  private connected: boolean = false;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(
    apiServerUrl = DEFAULT_API_URL,
    trajectoryServerUrl = DEFAULT_TRAJECTORY_URL,
  ) {
    this.apiServerUrl = apiServerUrl;
    this.trajectoryServerUrl = trajectoryServerUrl;
    this.http = axios.create({
      baseURL: apiServerUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public updateUrls(apiServerUrl: string, trajectoryServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
    this.trajectoryServerUrl = trajectoryServerUrl;
    this.http.defaults.baseURL = apiServerUrl;
    if (this.sio) {
      this.disconnectSocket();
      this.initSocket();
    }
  }

  public initSocket(onConnectChange?: (connected: boolean) => void) {
    try {
      const url = new URL(this.apiServerUrl);
      this.sio = io(url.origin, {
        path: url.pathname === '/' ? '/socket.io' : `${url.pathname}/socket.io`,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 8000,
      });

      this.sio.on('connect', () => {
        this.connected = true;
        onConnectChange?.(true);
        for (const [room] of this.listeners) {
          this.sio?.emit('subscribe', { room });
        }
      });

      this.sio.on('disconnect', () => {
        this.connected = false;
        onConnectChange?.(false);
      });

      this.sio.on('connect_error', () => {
        this.connected = false;
        onConnectChange?.(false);
      });
    } catch (e) {
      this.connected = false;
      onConnectChange?.(false);
    }
  }

  public disconnectSocket() {
    if (this.sio) {
      this.sio.disconnect();
      this.sio = null;
    }
    this.connected = false;
  }

  public subscribe<T>(room: string, handler: (data: T) => void): () => void {
    if (!this.listeners.has(room)) {
      this.listeners.set(room, new Set());
      if (this.sio && this.connected) {
        this.sio.emit('subscribe', { room });
      }
    }
    this.listeners.get(room)!.add(handler);

    const onMessage = (data: T) => handler(data);
    this.sio?.on(room, onMessage);

    return () => {
      const set = this.listeners.get(room);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.listeners.delete(room);
          this.sio?.emit('unsubscribe', { room });
        }
      }
      this.sio?.off(room, onMessage);
    };
  }

  // REST API Methods with real RMF Schema Normalization
  public async getBuildingMap(): Promise<BuildingMap> {
    const res = await this.http.get<any>('/building_map');
    const raw = res.data;
    if (!raw) return { name: 'Building', levels: [], lifts: [] };

    const normalizedLevels = (raw.levels || []).map((level: any) => {
      // 1. Normalize Wall Segments from wall_graph
      let wallSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];
      if (level.wall_graph?.vertices && level.wall_graph?.edges) {
        const verts = level.wall_graph.vertices;
        level.wall_graph.edges.forEach((edge: any) => {
          const v1 = verts[edge.v1_idx];
          const v2 = verts[edge.v2_idx];
          if (v1 && v2) {
            wallSegments.push({
              x1: v1.x,
              y1: v1.y,
              x2: v2.x,
              y2: v2.y,
            });
          }
        });
      }

      // 2. Normalize Doors
      const normalizedDoors = (level.doors || []).map((d: any) => {
        const midX = d.v1_x !== undefined && d.v2_x !== undefined ? (d.v1_x + d.v2_x) / 2 : (d.x ?? 0);
        const midY = d.v1_y !== undefined && d.v2_y !== undefined ? (d.v1_y + d.v2_y) / 2 : (d.y ?? 0);
        return {
          name: d.name,
          door_type: d.door_type ?? 1,
          motion_range: d.motion_range ?? 1.57,
          motion_direction: d.motion_direction ?? 1,
          level_name: level.name,
          x: midX,
          y: midY,
          yaw: d.yaw ?? 0,
        };
      });

      // 3. Normalize Nav Graphs (vertices & edges -> lanes)
      const normalizedNavGraphs = (level.nav_graphs || []).map((g: any, gIdx: number) => {
        const vertices = (g.vertices || []).map((v: any, vIdx: number) => {
          let isCharger = false;
          let isParking = false;
          let isHolding = false;
          if (Array.isArray(v.params)) {
            v.params.forEach((p: any) => {
              if (p.name === 'is_charger' && p.value_bool) isCharger = true;
              if (p.name === 'is_parking_spot' && p.value_bool) isParking = true;
              if (p.name === 'is_holding_point' && p.value_bool) isHolding = true;
            });
          }
          return {
            index: vIdx,
            x: v.x,
            y: v.y,
            name: v.name || '',
            is_charger: isCharger,
            is_parking_spot: isParking,
            is_holding_point: isHolding,
          };
        });

        const lanes = (g.edges || g.lanes || []).map((e: any, eIdx: number) => ({
          index: eIdx,
          entry: e.v1_idx ?? e.entry ?? 0,
          exit: e.v2_idx ?? e.exit ?? 0,
          two_way: true,
        }));

        return {
          name: g.name || `graph_${gIdx}`,
          vertices,
          lanes,
        };
      });

      return {
        name: level.name,
        elevation: level.elevation || 0,
        wall_segments: wallSegments,
        doors: normalizedDoors,
        nav_graphs: normalizedNavGraphs,
        images: level.images || [],
      };
    });

    return {
      name: raw.name || 'Building',
      levels: normalizedLevels,
      lifts: raw.lifts || [],
    };
  }

  public async getFleets(): Promise<FleetState[]> {
    const res = await this.http.get<any>('/fleets');
    const raw = res.data;
    const fleetsArray = Array.isArray(raw) ? raw : (raw?.value || []);

    return fleetsArray.map((fleet: any) => {
      let robotsArray: any[] = [];
      if (Array.isArray(fleet.robots)) {
        robotsArray = fleet.robots;
      } else if (fleet.robots && typeof fleet.robots === 'object') {
        robotsArray = Object.values(fleet.robots);
      }

      const normalizedRobots: RobotState[] = robotsArray.map((r: any) => ({
        name: r.name,
        model: r.model || 'Autonomous Mobile Unit',
        battery: r.battery !== undefined ? r.battery : 1.0,
        location: {
          x: r.location?.x ?? 0,
          y: r.location?.y ?? 0,
          yaw: r.location?.yaw ?? 0,
          level_name: r.location?.map ?? r.location?.level_name ?? 'L1',
          speed: r.location?.speed ?? 0,
        },
        path: r.path || [],
        mode: (r.status || r.mode || 'idle').toLowerCase() as any,
        task_id: r.task_id || null,
        commissioned: r.commission?.dispatch_tasks !== false,
        seq: r.seq || r.unix_millis_time || Date.now(),
        last_heartbeat: Date.now(),
        issues: r.issues || [],
        mutex_groups: r.mutex_groups?.locked || [],
      }));

      return {
        name: fleet.name,
        robots: normalizedRobots,
      };
    });
  }

  public async getFleetState(fleetName: string): Promise<FleetState> {
    const res = await this.http.get<any>(`/fleets/${fleetName}/state`);
    const f = res.data;
    let robotsArray = Array.isArray(f.robots) ? f.robots : Object.values(f.robots || {});
    return {
      name: f.name,
      robots: robotsArray.map((r: any) => ({
        name: r.name,
        model: r.model || 'Autonomous Mobile Unit',
        battery: r.battery ?? 1.0,
        location: {
          x: r.location?.x ?? 0,
          y: r.location?.y ?? 0,
          yaw: r.location?.yaw ?? 0,
          level_name: r.location?.map ?? r.location?.level_name ?? 'L1',
          speed: r.location?.speed ?? 0,
        },
        path: r.path || [],
        mode: (r.status || r.mode || 'idle').toLowerCase() as any,
        task_id: r.task_id || null,
        commissioned: r.commission?.dispatch_tasks !== false,
      })),
    };
  }

  public async decommissionRobot(
    fleetName: string,
    robotName: string,
    reassignTasks = true,
    allowIdleBehavior = false,
  ) {
    const res = await this.http.post(`/fleets/${fleetName}/decommission`, {
      name: fleetName,
      robot_name: robotName,
      reassign_tasks: reassignTasks,
      allow_idle_behavior: allowIdleBehavior,
    });
    return res.data;
  }

  public async getTasks(status?: string): Promise<TaskState[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const res = await this.http.get<any>('/tasks', { params });
    const raw = res.data;
    const taskList = Array.isArray(raw) ? raw : (raw?.value || []);

    const mapped: TaskState[] = taskList.map((t: any) => {
      const booking = t.booking || {
        id: t.task_id || t.id || 'task_unknown',
        requester: t.requester || 'Operator',
        unix_millis_request_time: t.unix_millis_request_time,
      };
      return {
        booking,
        category: (t.category || 'patrol').toLowerCase() as any,
        assigned_to: t.assigned_to || (t.robot_name ? { name: t.robot_name, group: t.fleet_name } : undefined),
        status: (t.status || 'underway').toLowerCase() as any,
        progress: t.progress ?? 0,
        unix_millis_start_time: t.unix_millis_start_time,
        unix_millis_finish_time: t.unix_millis_finish_time,
        estimate_millis: t.estimate_millis,
        phases: t.phases || [],
        active_phase_index: t.active_phase_index,
      };
    });

    return mapped.sort((a, b) => {
      const timeA = a.booking.unix_millis_request_time || a.unix_millis_start_time || 0;
      const timeB = b.booking.unix_millis_request_time || b.unix_millis_start_time || 0;
      return timeB - timeA;
    });
  }

  public async getTaskState(taskId: string): Promise<TaskState> {
    const res = await this.http.get<any>(`/tasks/${taskId}/state`);
    const t = res.data;
    return {
      booking: t.booking || { id: taskId },
      category: (t.category || 'patrol').toLowerCase() as any,
      status: (t.status || 'underway').toLowerCase() as any,
      progress: t.progress ?? 0,
      phases: t.phases || [],
      active_phase_index: t.active_phase_index,
    };
  }

  public async getTaskLogs(taskId: string): Promise<TaskLogEntry[]> {
    try {
      const res = await this.http.get<any>(`/tasks/${taskId}/log`);
      const raw = res.data;
      if (Array.isArray(raw)) return raw;
      if (raw?.phases) {
        const entries: TaskLogEntry[] = [];
        let seq = 1;
        Object.entries(raw.phases).forEach(([phaseId, p]: [string, any]) => {
          if (Array.isArray(p.events)) {
            p.events.forEach((ev: any) => {
              entries.push({
                seq: seq++,
                timestamp: ev.unix_millis_time || Date.now(),
                tier: ev.tier || 'info',
                text: `Phase ${phaseId}: ${ev.name || ev.detail || 'Event registered'}`,
              });
            });
          }
        });
        return entries;
      }
      return [];
    } catch {
      return [];
    }
  }

  public async dispatchTask(request: {
    category: string;
    description: any;
    priority?: number;
    fleet_name?: string;
    requester?: string;
    labels?: string[];
  }) {
    const payload: any = {
      type: 'dispatch_task_request',
      request: {
        category: request.category || 'patrol',
        description: request.description || {},
        requester: request.requester || 'FMS_Operator',
        unix_millis_request_time: Date.now(),
        labels: request.labels || [`app=fms`, `category=${request.category}`],
      },
    };

    if (request.priority !== undefined && request.priority !== null) {
      payload.request.priority = { type: 'binary', value: request.priority };
    }

    if (request.fleet_name) {
      payload.request.fleet_name = request.fleet_name;
    }

    const res = await this.http.post('/tasks/dispatch_task', payload);
    return res.data;
  }

  public async dispatchRobotTask(options: {
    robot: string;
    fleet: string;
    category: string;
    description: any;
    priority?: number;
    requester?: string;
    labels?: string[];
  }) {
    const requestPayload: any = {
      category: options.category || 'patrol',
      description: options.description || {},
      requester: options.requester || 'FMS_Operator',
      unix_millis_request_time: Date.now(),
      labels: options.labels || [`app=fms`, `category=${options.category}`],
    };

    if (options.priority !== undefined && options.priority !== null) {
      requestPayload.priority = { type: 'binary', value: options.priority };
    }

    const payload = {
      type: 'robot_task_request',
      robot: options.robot,
      fleet: options.fleet,
      request: requestPayload,
    };

    const res = await this.http.post('/tasks/robot_task', payload);
    return res.data;
  }

  public async cancelTask(taskId: string) {
    const res = await this.http.post('/tasks/cancel_task', {
      type: 'cancel_task_request',
      task_id: taskId,
    });
    return res.data;
  }

  public async getDoors(): Promise<Door[]> {
    const res = await this.http.get<any>('/doors');
    const raw = res.data;
    const list = Array.isArray(raw) ? raw : (raw?.value || []);
    return list.map((d: any) => ({
      name: d.name,
      door_type: d.door_type ?? 1,
      motion_range: d.motion_range ?? 1.57,
      motion_direction: d.motion_direction ?? 1,
      level_name: d.level_name || 'L1',
      x: d.v1_x !== undefined && d.v2_x !== undefined ? (d.v1_x + d.v2_x) / 2 : (d.x ?? 0),
      y: d.v1_y !== undefined && d.v2_y !== undefined ? (d.v1_y + d.v2_y) / 2 : (d.y ?? 0),
    }));
  }

  public async getDoorState(doorName: string): Promise<DoorState> {
    const res = await this.http.get<any>(`/doors/${doorName}/state`);
    const d = res.data;
    const modeVal = d.current_mode?.value ?? 0;
    const modeString = modeVal === 2 ? 'open' : modeVal === 1 ? 'moving' : 'closed';
    return {
      door_name: doorName,
      current_mode: { value: modeVal },
      mode_string: modeString,
      door_time: d.door_time?.sec ? d.door_time.sec * 1000 : Date.now(),
    };
  }

  public async requestDoor(doorName: string, mode: number) {
    const res = await this.http.post(`/doors/${doorName}/request`, {
      mode: { value: mode },
    });
    return res.data;
  }

  public async getLifts(): Promise<Lift[]> {
    const res = await this.http.get<any>('/lifts');
    const raw = res.data;
    return Array.isArray(raw) ? raw : (raw?.value || []);
  }

  public async getLiftState(liftName: string): Promise<LiftState> {
    const res = await this.http.get<any>(`/lifts/${liftName}/state`);
    const l = res.data;
    return {
      lift_name: liftName,
      current_floor: l.current_floor || 'L1',
      destination_floor: l.destination_floor || l.current_floor || 'L1',
      door_state: l.door_state === 2 ? 'open' : 'closed',
      motion_state: l.motion_state === 1 ? 'up' : l.motion_state === 2 ? 'down' : 'stopped',
      available_floors: l.available_floors || ['L1'],
      current_mode: l.current_mode?.value ?? 0,
    };
  }

  public async requestLift(
    liftName: string,
    destination: string,
    requestType = 0,
    doorMode = 0,
  ) {
    const res = await this.http.post(`/lifts/${liftName}/request`, {
      destination,
      request_type: requestType,
      door_mode: doorMode,
      additional_session_ids: [],
    });
    return res.data;
  }

  public async getDispensers(): Promise<WorkcellItem[]> {
    try {
      const res = await this.http.get<any>('/dispensers');
      const list = Array.isArray(res.data) ? res.data : (res.data?.value || []);
      return list.map((item: any) => ({
        guid: item.guid,
        category: 'dispenser',
        state: 'idle',
        location_level: 'L1',
        x: 0,
        y: 0,
      }));
    } catch {
      return [];
    }
  }

  public async getIngestors(): Promise<WorkcellItem[]> {
    try {
      const res = await this.http.get<any>('/ingestors');
      const list = Array.isArray(res.data) ? res.data : (res.data?.value || []);
      return list.map((item: any) => ({
        guid: item.guid,
        category: 'ingestor',
        state: 'idle',
        location_level: 'L1',
        x: 0,
        y: 0,
      }));
    } catch {
      return [];
    }
  }

  public isConnected() {
    return this.connected;
  }
}

export const rmfClient = new RmfClient();
