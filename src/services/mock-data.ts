import {
  BuildingMap,
  FleetState,
  TaskState,
  DoorState,
  LiftState,
  WorkcellItem,
  Alert,
  MutexGroup,
  TaskLogEntry,
} from '../types/rmf';
import airportBuildingMapData from '../data/airportBuildingMap.json';
import airportFleetsData from '../data/airportFleets.json';

export const INITIAL_BUILDING_MAP: BuildingMap = airportBuildingMapData as BuildingMap;

export const INITIAL_FLEETS: FleetState[] = airportFleetsData as FleetState[];

export const LEGACY_BUILDING_MAP: BuildingMap = {
  name: 'VNTT_HighTech_Campus',
  lifts: [
    {
      name: 'Lift_Central',
      levels: ['L1', 'L2'],
      doors: [],
      ref_x: 480,
      ref_y: 280,
      ref_yaw: 0,
      width: 40,
      depth: 40,
    },
  ],
  levels: [
    {
      name: 'L1',
      elevation: 0.0,
      doors: [
        {
          name: 'AirLock_Main',
          door_type: 1, // sliding
          level_name: 'L1',
          motion_range: 20,
          motion_direction: 1,
          x: 360,
          y: 220,
          yaw: 0,
        },
        {
          name: 'Door_Warehouse_East',
          door_type: 2, // double sliding
          level_name: 'L1',
          motion_range: 25,
          motion_direction: 1,
          x: 640,
          y: 350,
          yaw: 90,
        },
        {
          name: 'Door_Cleanroom_North',
          door_type: 3, // swing
          level_name: 'L1',
          motion_range: 90,
          motion_direction: 1,
          x: 220,
          y: 380,
          yaw: 0,
        },
      ],
      wall_segments: [
        // Outer boundary
        { x1: 60, y1: 60, x2: 860, y2: 60 },
        { x1: 860, y1: 60, x2: 860, y2: 560 },
        { x1: 860, y1: 560, x2: 60, y2: 560 },
        { x1: 60, y1: 560, x2: 60, y2: 60 },

        // Internal rooms & partitions
        // Charging & Maintenance Bay (Top Left)
        { x1: 60, y1: 180, x2: 260, y2: 180 },
        { x1: 260, y1: 180, x2: 260, y2: 60 },

        // Cleanroom / Lab (Bottom Left)
        { x1: 60, y1: 340, x2: 300, y2: 340 },
        { x1: 300, y1: 340, x2: 300, y2: 560 },

        // Main Warehouse Storage Racks (Right)
        { x1: 580, y1: 60, x2: 580, y2: 240 },
        { x1: 580, y1: 280, x2: 580, y2: 560 },

        // Central divider corridor walls
        { x1: 320, y1: 220, x2: 350, y2: 220 },
        { x1: 375, y1: 220, x2: 520, y2: 220 },
      ],
      nav_graphs: [
        {
          name: 'fleet_nav_graph',
          vertices: [
            { index: 0, x: 120, y: 120, name: 'Charger_01', is_charger: true },
            { index: 1, x: 200, y: 120, name: 'Charger_02', is_charger: true },
            { index: 2, x: 180, y: 240, name: 'Station_Prep_A', is_parking_spot: true },
            { index: 3, x: 300, y: 220, name: 'Corridor_West' },
            { index: 4, x: 420, y: 220, name: 'Crossroad_Center', is_holding_point: true },
            { index: 5, x: 420, y: 120, name: 'Depot_North' },
            { index: 6, x: 420, y: 380, name: 'Corridor_South' },
            { index: 7, x: 180, y: 440, name: 'Cleanroom_Bay_1', is_parking_spot: true },
            { index: 8, x: 480, y: 280, name: 'Lift_L1_Entry' },
            { index: 9, x: 620, y: 220, name: 'Warehouse_Junction' },
            { index: 10, x: 740, y: 150, name: 'Rack_A1_Pickup', is_parking_spot: true },
            { index: 11, x: 740, y: 350, name: 'Rack_B2_Dropoff', is_parking_spot: true },
            { index: 12, x: 740, y: 480, name: 'Outbound_Dock', is_holding_point: true },
          ],
          lanes: [
            { index: 0, entry: 0, exit: 2, two_way: true },
            { index: 1, entry: 1, exit: 2, two_way: true },
            { index: 2, entry: 2, exit: 3, two_way: true },
            { index: 3, entry: 3, exit: 4, two_way: true },
            { index: 4, entry: 4, exit: 5, two_way: true },
            { index: 5, entry: 4, exit: 6, two_way: true },
            { index: 6, entry: 6, exit: 7, two_way: true },
            { index: 7, entry: 4, exit: 8, two_way: true },
            { index: 8, entry: 4, exit: 9, two_way: true },
            { index: 9, entry: 9, exit: 10, two_way: true },
            { index: 10, entry: 9, exit: 11, two_way: true },
            { index: 11, entry: 11, exit: 12, two_way: true },
            { index: 12, entry: 6, exit: 12, two_way: true },
          ],
        },
      ],
    },
    {
      name: 'L2',
      elevation: 4.5,
      doors: [
        {
          name: 'Door_Assembly_AirLock',
          door_type: 1,
          level_name: 'L2',
          motion_range: 20,
          motion_direction: 1,
          x: 400,
          y: 280,
          yaw: 0,
        },
      ],
      wall_segments: [
        { x1: 100, y1: 100, x2: 800, y2: 100 },
        { x1: 800, y1: 100, x2: 800, y2: 500 },
        { x1: 800, y1: 500, x2: 100, y2: 500 },
        { x1: 100, y1: 500, x2: 100, y2: 100 },
      ],
      nav_graphs: [
        {
          name: 'l2_nav_graph',
          vertices: [
            { index: 0, x: 480, y: 280, name: 'Lift_L2_Entry' },
            { index: 1, x: 300, y: 280, name: 'L2_Assembly_Line_1' },
            { index: 2, x: 650, y: 280, name: 'L2_Testing_Lab' },
          ],
          lanes: [
            { index: 0, entry: 0, exit: 1, two_way: true },
            { index: 1, entry: 0, exit: 2, two_way: true },
          ],
        },
      ],
    },
  ],
};

export const LEGACY_FLEETS: FleetState[] = [
  {
    name: 'TinyRobotFleet',
    robots: [
      {
        name: 'tinyRobot_01',
        model: 'AGV-Carrier-X',
        battery: 0.88,
        location: {
          x: 350,
          y: 220,
          yaw: 0.15,
          level_name: 'L1',
          speed: 1.1,
        },
        path: [
          { x: 350, y: 220, level_name: 'L1' },
          { x: 420, y: 220, level_name: 'L1' },
          { x: 620, y: 220, level_name: 'L1' },
          { x: 740, y: 150, level_name: 'L1' },
        ],
        mode: 'moving',
        task_id: 'task_deliv_8819',
        commissioned: true,
        seq: 4120,
        last_heartbeat: Date.now() - 500,
        mutex_groups: ['AirLock_A_Zone'],
      },
      {
        name: 'tinyRobot_02',
        model: 'AGV-Carrier-X',
        battery: 0.54,
        location: {
          x: 420,
          y: 380,
          yaw: 1.57,
          level_name: 'L1',
          speed: 0.8,
        },
        path: [
          { x: 420, y: 380, level_name: 'L1' },
          { x: 180, y: 440, level_name: 'L1' },
        ],
        mode: 'moving',
        task_id: 'task_patrol_2031',
        commissioned: true,
        seq: 3980,
        last_heartbeat: Date.now() - 300,
      },
      {
        name: 'tinyRobot_03',
        model: 'AGV-Carrier-X',
        battery: 0.19,
        location: {
          x: 120,
          y: 120,
          yaw: -1.57,
          level_name: 'L1',
          speed: 0.0,
        },
        path: [],
        mode: 'charging',
        task_id: null,
        commissioned: true,
        seq: 5201,
        last_heartbeat: Date.now() - 1200,
        issues: ['Low Battery Threshold (<20%)'],
      },
    ],
  },
  {
    name: 'DeliveryFleet',
    robots: [
      {
        name: 'forklift_01',
        model: 'AutoFork-2000',
        battery: 0.76,
        location: {
          x: 740,
          y: 350,
          yaw: 3.14,
          level_name: 'L1',
          speed: 0.0,
        },
        path: [
          { x: 740, y: 350, level_name: 'L1' },
          { x: 740, y: 480, level_name: 'L1' },
        ],
        mode: 'waiting',
        task_id: 'task_deliv_9142',
        commissioned: true,
        seq: 1850,
        last_heartbeat: Date.now() - 400,
      },
      {
        name: 'forklift_02',
        model: 'AutoFork-2000',
        battery: 0.95,
        location: {
          x: 200,
          y: 120,
          yaw: 0,
          level_name: 'L1',
          speed: 0.0,
        },
        path: [],
        mode: 'idle',
        task_id: null,
        commissioned: true,
        seq: 820,
        last_heartbeat: Date.now() - 1500,
      },
    ],
  },
  {
    name: 'CleanerFleet',
    robots: [
      {
        name: 'cleanerBot_01',
        model: 'EcoClean-Pro',
        battery: 0.62,
        location: {
          x: 420,
          y: 160,
          yaw: -0.75,
          level_name: 'L1',
          speed: 0.5,
        },
        path: [
          { x: 420, y: 160, level_name: 'L1' },
          { x: 420, y: 120, level_name: 'L1' },
        ],
        mode: 'moving',
        task_id: 'task_clean_3002',
        commissioned: true,
        seq: 9400,
        last_heartbeat: Date.now() - 600,
      },
    ],
  },
];

export const INITIAL_TASKS: TaskState[] = [
  {
    booking: {
      id: 'task_deliv_8819',
      requester: 'ERP_MES_Dispatcher',
      unix_millis_request_time: Date.now() - 320000,
      priority: { type: 'binary', value: 1 },
      labels: ['sku=IC_CHIP_TRAY_50', 'zone=assembly'],
    },
    category: 'delivery',
    assigned_to: {
      group: 'TinyRobotFleet',
      name: 'tinyRobot_01',
    },
    status: 'underway',
    progress: 68,
    unix_millis_start_time: Date.now() - 280000,
    estimate_millis: 400000,
    phases: [
      {
        id: 1,
        category: 'navigation',
        detail: 'Navigate to Station_Prep_A pickup station',
        status: 'completed',
        unix_millis_start_time: Date.now() - 280000,
        unix_millis_finish_time: Date.now() - 190000,
      },
      {
        id: 2,
        category: 'dispenser',
        detail: 'Wait dispenser Dispenser_IC_01 to load tray',
        status: 'completed',
        unix_millis_start_time: Date.now() - 190000,
        unix_millis_finish_time: Date.now() - 120000,
      },
      {
        id: 3,
        category: 'navigation',
        detail: 'Transit through Corridor_West & AirLock_Main to Rack_A1_Pickup',
        status: 'underway',
        unix_millis_start_time: Date.now() - 120000,
      },
      {
        id: 4,
        category: 'ingestor',
        detail: 'Offload tray at Rack_A1_Pickup intake buffer',
        status: 'pending',
      },
    ],
    active_phase_index: 2,
  },
  {
    booking: {
      id: 'task_patrol_2031',
      requester: 'Security_Monitor',
      unix_millis_request_time: Date.now() - 500000,
      priority: { type: 'binary', value: 0 },
      labels: ['route=cleanroom_perimeter', 'rounds=3'],
    },
    category: 'patrol',
    assigned_to: {
      group: 'TinyRobotFleet',
      name: 'tinyRobot_02',
    },
    status: 'underway',
    progress: 42,
    unix_millis_start_time: Date.now() - 480000,
    estimate_millis: 900000,
    phases: [
      {
        id: 1,
        category: 'patrol_round_1',
        detail: 'Patrol Corridor_South waypoint check',
        status: 'completed',
      },
      {
        id: 2,
        category: 'patrol_round_2',
        detail: 'Patrol Cleanroom_Bay_1 waypoint inspect',
        status: 'underway',
      },
      {
        id: 3,
        category: 'patrol_round_3',
        detail: 'Patrol Return to Crossroad_Center',
        status: 'pending',
      },
    ],
    active_phase_index: 1,
  },
  {
    booking: {
      id: 'task_clean_3002',
      requester: 'Facility_Manager',
      unix_millis_request_time: Date.now() - 700000,
      labels: ['zone=Depot_North', 'intensity=deep'],
    },
    category: 'clean',
    assigned_to: {
      group: 'CleanerFleet',
      name: 'cleanerBot_01',
    },
    status: 'underway',
    progress: 85,
    unix_millis_start_time: Date.now() - 650000,
    estimate_millis: 750000,
    phases: [
      {
        id: 1,
        category: 'clean_zone',
        detail: 'Surface sanitization in Depot_North',
        status: 'underway',
      },
    ],
    active_phase_index: 0,
  },
  {
    booking: {
      id: 'task_deliv_9142',
      requester: 'WMS_System',
      unix_millis_request_time: Date.now() - 120000,
      labels: ['pallet_id=PALLET_9921', 'destination=dock'],
    },
    category: 'delivery',
    assigned_to: {
      group: 'DeliveryFleet',
      name: 'forklift_01',
    },
    status: 'underway',
    progress: 30,
    unix_millis_start_time: Date.now() - 100000,
    estimate_millis: 300000,
    phases: [
      {
        id: 1,
        category: 'load_pallet',
        detail: 'Engage pallet forks at Rack_B2_Dropoff',
        status: 'underway',
      },
      {
        id: 2,
        category: 'transit',
        detail: 'Transport pallet to Outbound_Dock',
        status: 'pending',
      },
    ],
    active_phase_index: 0,
  },
  {
    booking: {
      id: 'task_queued_1044',
      requester: 'Operator_Truong',
      unix_millis_request_time: Date.now() - 30000,
      labels: ['type=material_dispatch'],
    },
    category: 'delivery',
    status: 'queued',
    progress: 0,
  },
  {
    booking: {
      id: 'task_done_5510',
      requester: 'AutoScheduler',
      unix_millis_request_time: Date.now() - 3600000,
    },
    category: 'patrol',
    assigned_to: {
      group: 'TinyRobotFleet',
      name: 'tinyRobot_01',
    },
    status: 'completed',
    progress: 100,
    unix_millis_start_time: Date.now() - 3500000,
    unix_millis_finish_time: Date.now() - 2900000,
  },
];

export const INITIAL_DOOR_STATES: Record<string, DoorState> = {
  n01_door: {
    door_name: 'n01_door',
    current_mode: { value: 0 },
    mode_string: 'closed',
    door_time: Date.now(),
  },
  n02_door: {
    door_name: 'n02_door',
    current_mode: { value: 0 },
    mode_string: 'closed',
    door_time: Date.now(),
  },
  s04_door: {
    door_name: 's04_door',
    current_mode: { value: 0 },
    mode_string: 'closed',
    door_time: Date.now(),
  },
  s08_door: {
    door_name: 's08_door',
    current_mode: { value: 0 },
    mode_string: 'closed',
    door_time: Date.now(),
  },
  zone_4_door: {
    door_name: 'zone_4_door',
    current_mode: { value: 2 },
    mode_string: 'open',
    door_time: Date.now(),
  },
};

export const INITIAL_LIFT_STATES: Record<string, LiftState> = {};

export const INITIAL_WORKCELLS: WorkcellItem[] = [
  {
    guid: 'coke_dispenser',
    category: 'dispenser',
    state: 'idle',
    location_level: 'L1',
    x: 94.2,
    y: -44.3,
    payload_capacity: 20,
    current_payload: 'Beverage_Batch_Airport',
  },
  {
    guid: 'coke_dispenser_2',
    category: 'dispenser',
    state: 'idle',
    location_level: 'L1',
    x: 122.9,
    y: -50.8,
    payload_capacity: 20,
    current_payload: 'Beverage_Batch_Zone4',
  },
  {
    guid: 'mopcart_dispenser',
    category: 'dispenser',
    state: 'idle',
    location_level: 'L1',
    x: 159.7,
    y: -55.6,
    payload_capacity: 5,
    current_payload: 'Sanitization_Cart_E',
  },
  {
    guid: 'coke_ingestor',
    category: 'ingestor',
    state: 'idle',
    location_level: 'L1',
    x: 14.8,
    y: -9.3,
    payload_capacity: 20,
  },
  {
    guid: 'coke_ingestor_2',
    category: 'ingestor',
    state: 'idle',
    location_level: 'L1',
    x: 152.3,
    y: -44.3,
    payload_capacity: 20,
  },
  {
    guid: 'mopcart_collector',
    category: 'ingestor',
    state: 'idle',
    location_level: 'L1',
    x: 163.4,
    y: -55.6,
    payload_capacity: 5,
  },
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alt_001',
    title: 'Low Battery Warning',
    message: 'tinyRobot_03 battery dropped to 19%. Auto-routed to Charger_01.',
    severity: 'warning',
    timestamp: Date.now() - 600000,
    acknowledged: false,
    entity_type: 'robot',
    entity_id: 'tinyRobot_03',
  },
  {
    id: 'alt_002',
    title: 'AirLock Open Prolonged',
    message: 'AirLock_Main has remained open for over 45s during autonomous transit.',
    severity: 'info',
    timestamp: Date.now() - 180000,
    acknowledged: false,
    entity_type: 'door',
    entity_id: 'AirLock_Main',
  },
  {
    id: 'alt_003',
    title: 'Lane Speed Advisory',
    message: 'High traffic density detected around Crossroad_Center. Dynamic slowdown active.',
    severity: 'info',
    timestamp: Date.now() - 90000,
    acknowledged: true,
    entity_type: 'system',
  },
];

export const INITIAL_MUTEX_GROUPS: MutexGroup[] = [
  {
    name: 'AirLock_A_Zone',
    locked_by: 'tinyRobot_01',
    waiting_queue: [],
  },
  {
    name: 'Lift_Corridor_Shared',
    locked_by: null,
    waiting_queue: [],
  },
  {
    name: 'Cleanroom_Intake_Airlock',
    locked_by: null,
    waiting_queue: ['tinyRobot_02'],
  },
];

export const SAMPLE_TASK_LOGS: Record<string, TaskLogEntry[]> = {
  task_deliv_8819: [
    { seq: 1, timestamp: Date.now() - 279000, tier: 'info', text: 'Task accepted by fleet adapter [TinyRobotFleet]' },
    { seq: 2, timestamp: Date.now() - 278000, tier: 'info', text: 'Allocated robot [tinyRobot_01] at vertex [Station_Prep_A]' },
    { seq: 3, timestamp: Date.now() - 190000, tier: 'info', text: 'Arrived at pickup point. Handshaking with dispenser [Dispenser_IC_01]' },
    { seq: 4, timestamp: Date.now() - 125000, tier: 'info', text: 'Dispenser payload confirmation received: IC_Tray_Batch_A loaded' },
    { seq: 5, timestamp: Date.now() - 119000, tier: 'info', text: 'Requesting door open for [AirLock_Main]' },
    { seq: 6, timestamp: Date.now() - 95000, tier: 'info', text: 'Door [AirLock_Main] confirmed OPEN. Acquiring mutex lock [AirLock_A_Zone]' },
    { seq: 7, timestamp: Date.now() - 30000, tier: 'info', text: 'En route to Rack_A1_Pickup. Estimated remaining transit time: 42s' },
  ],
  task_patrol_2031: [
    { seq: 1, timestamp: Date.now() - 478000, tier: 'info', text: 'Patrol cycle 1 initialized. Waypoints loaded: 3' },
    { seq: 2, timestamp: Date.now() - 320000, tier: 'info', text: 'Waypoint 1 reached successfully without obstacles' },
    { seq: 3, timestamp: Date.now() - 150000, tier: 'info', text: 'Beginning patrol cycle 2 at Corridor_South' },
  ],
};
