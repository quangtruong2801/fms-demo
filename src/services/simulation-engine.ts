import { FleetState, TaskState, DoorState, LiftState } from '../types/rmf';

export class SimulationEngine {
  private timer: number | null = null;
  private onUpdate: (data: {
    fleets: FleetState[];
    tasks: TaskState[];
    doors: Record<string, DoorState>;
    lifts: Record<string, LiftState>;
  }) => void;

  constructor(
    onUpdate: (data: {
      fleets: FleetState[];
      tasks: TaskState[];
      doors: Record<string, DoorState>;
      lifts: Record<string, LiftState>;
    }) => void,
  ) {
    this.onUpdate = onUpdate;
  }

  public start(
    initialFleets: FleetState[],
    initialTasks: TaskState[],
    initialDoors: Record<string, DoorState>,
    initialLifts: Record<string, LiftState>,
  ) {
    let fleets = JSON.parse(JSON.stringify(initialFleets)) as FleetState[];
    let tasks = JSON.parse(JSON.stringify(initialTasks)) as TaskState[];
    let doors = JSON.parse(JSON.stringify(initialDoors)) as Record<string, DoorState>;
    let lifts = JSON.parse(JSON.stringify(initialLifts)) as Record<string, LiftState>;

    this.timer = window.setInterval(() => {
      // 1. Move robots along their paths
      fleets = fleets.map((fleet) => ({
        ...fleet,
        robots: fleet.robots.map((robot) => {
          if (!robot.commissioned || robot.mode === 'emergency' || robot.mode === 'paused') {
            return robot;
          }

          // If charging
          if (robot.mode === 'charging') {
            const newBat = Math.min(1.0, robot.battery + 0.003);
            return {
              ...robot,
              battery: Number(newBat.toFixed(3)),
              mode: newBat >= 0.95 ? 'idle' : 'charging',
            };
          }

          // If moving with a path
          if (robot.mode === 'moving' && robot.path && robot.path.length > 0) {
            const target = robot.path[0];
            const dx = target.x - robot.location.x;
            const dy = target.y - robot.location.y;
            const dist = Math.hypot(dx, dy);
            const speed = 2.5;

            if (dist < 4) {
              // Reached next waypoint
              const nextPath = robot.path.slice(1);
              if (nextPath.length === 0) {
                // Done path
                return {
                  ...robot,
                  location: {
                    ...robot.location,
                    x: target.x,
                    y: target.y,
                  },
                  path: [],
                  mode: 'waiting',
                };
              }
              return {
                ...robot,
                location: {
                  ...robot.location,
                  x: target.x,
                  y: target.y,
                },
                path: nextPath,
              };
            }

            // Interpolate toward target
            const angle = Math.atan2(dy, dx);
            const moveX = Math.cos(angle) * speed;
            const moveY = Math.sin(angle) * speed;

            const newBattery = Math.max(0.05, robot.battery - 0.0002);

            return {
              ...robot,
              location: {
                ...robot.location,
                x: robot.location.x + moveX,
                y: robot.location.y + moveY,
                yaw: angle,
              },
              battery: Number(newBattery.toFixed(3)),
            };
          }

          return robot;
        }),
      }));

      // 2. Advance underway tasks
      tasks = tasks.map((task) => {
        if (task.status === 'underway' && task.progress !== undefined) {
          const nextProgress = Math.min(100, task.progress + 1);
          const isDone = nextProgress >= 100;

          return {
            ...task,
            progress: nextProgress,
            status: isDone ? 'completed' : 'underway',
            unix_millis_finish_time: isDone ? Date.now() : undefined,
          };
        }
        return task;
      });

      this.onUpdate({ fleets, tasks, doors, lifts });
    }, 400);
  }

  public stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
