// *** NPM ***
import React, { useState } from 'react';

import { getProgressPoint } from '../../../helpers/bar-helper';
import { BarTask } from '../../../types/bar-task';
import { GanttContentMoveAction } from '../../../types/gantt-task-actions';
// *** OTHER ***
import Bar from '../Bar';
import BarDateHandle from '../components/BarDateHandle';
import BarDisplay, {
  defaultProps as barDisplayDefaultProps,
} from '../components/BarDisplay';
import BarProgressHandle from '../components/BarProgressHandle';

// *** TYPES ***
export interface IProps {
  task: BarTask;
  rtl: boolean;
  isDateChangeable: boolean;
  isProgressChangeable: boolean;
  onEventStart: (
    action: GanttContentMoveAction,
    selectedTask: BarTask,
    event?: React.MouseEvent | React.KeyboardEvent,
  ) => any;
}

const BarOriginal = (props: IProps) => {
  // *** PROPS ***
  const { task, rtl, isDateChangeable, isProgressChangeable, onEventStart } =
    props;

  // *** USE STATE ***
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const backgroundColor =
    task.progress < 100
      ? 'var(--bgColor-success-muted)'
      : 'var(--bgColor-done-muted)';
  const progressSelectedColor =
    task.progress < 100
      ? 'var(--bgColor-open-emphasis)'
      : task.end.getTime() < Date.now()
        ? 'var(--borderColor-default)'
        : 'var(--bgColor-success-emphasis)';

  // *** CONDITIONALS ***
  // bar display
  const barDisplay = (
    <BarDisplay
      x={task.x1}
      y={task.y}
      progressX={task.progressX}
      progressWidth={task.progressWidth}
      barCornerRadius={task.barCornerRadius}
      onMouseDown={(e: React.MouseEvent<Element, MouseEvent>) => {
        isDateChangeable === true && onEventStart('move', task, e);
      }}
      // style
      rootStyle={{
        ...barDisplayDefaultProps.rootStyle,
        height: task.height,
      }}
      barStyle={{
        ...barDisplayDefaultProps.barStyle,
        height: task.height,
        width: task.x2 - task.x1,
        fill: backgroundColor,
      }}
      progressStyle={{
        ...barDisplayDefaultProps.progressStyle,
        height: task.height,
        fill: progressSelectedColor,
      }}
    />
  );

  // left bar date handle
  const leftBarDateHandle = (
    <BarDateHandle
      x={task.x1 + 1}
      y={task.y + 1}
      width={task.handleWidth}
      height={task.height - 2}
      barCornerRadius={task.barCornerRadius}
      onMouseDown={(e) => onEventStart('start', task, e)}
      // style
      rootStyle={{
        fill: '#ddd',
        cursor: 'ew-resize',
        opacity: isHovered ? 1 : 0,
        visibility: isHovered ? 'visible' : 'hidden',
      }}
    />
  );

  // right bar date handle
  const rightBarDateHandle = (
    <BarDateHandle
      x={task.x2 - task.handleWidth - 1}
      y={task.y + 1}
      height={task.height - 2}
      width={task.handleWidth}
      barCornerRadius={task.barCornerRadius}
      onMouseDown={(e) => onEventStart('end', task, e)}
      // style
      rootStyle={{
        fill: '#ddd',
        cursor: 'ew-resize',
        opacity: isHovered ? 1 : 0,
        visibility: isHovered ? 'visible' : 'hidden',
      }}
    />
  );

  // bar progress handle
  const barProgressPoint = getProgressPoint(
    +!rtl * task.progressWidth + task.progressX,
    task.y,
    task.height,
  );

  const barProgressHandle = (
    <BarProgressHandle
      progressPoint={barProgressPoint}
      onMouseDown={(e) => onEventStart('progress', task, e)}
      // style
      rootStyle={{
        fill: '#ddd',
        cursor: 'ew-resize',
        opacity: isHovered ? 1 : 0,
        visibility: isHovered ? 'visible' : 'hidden',
      }}
    />
  );

  return (
    <svg style={{ overflow: 'visible' }}>
      <Bar
        rtl={rtl}
        isDateChangeable={isDateChangeable}
        isProgressChangeable={isProgressChangeable}
        // components
        barDisplay={barDisplay}
        leftBarDateHandle={leftBarDateHandle}
        rightBarDateHandle={rightBarDateHandle}
        barProgressHandle={barProgressHandle}
        // handlers
        onMouseEnter={() => setIsHovered(() => true)}
        onMouseLeave={() => setIsHovered(() => false)}
      />
    </svg>
  );
};

export default BarOriginal;
