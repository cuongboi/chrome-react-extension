// *** NPM ***
import React, { useEffect, useRef, useState } from 'react';

import { BarTask } from '../../../types/bar-task';
import { OptionalKeys } from '../../../types/custom';
import { GanttContentMoveAction } from '../../../types/gantt-task-actions';
// *** OTHER ***
import BarSmall from '../../Bars/BarSmall';
import MileStone from '../../Bars/MileStone';
import Project, {
  defaultProps as projectDefaultProps,
} from '../../Bars/Project';
import BarOriginal from '../../Bars/examples/BarOriginal';

// *** TYPES ***
export type IProps = {
  task: BarTask;
  taskHeight: number;
  isDateChangeable: boolean;
  isProgressChangeable: boolean;
  arrowIndent: number;
  isDelete: boolean;
  isSelected: boolean;
  rtl: boolean;
  onEventStart: (
    action: GanttContentMoveAction,
    selectedTask: BarTask,
    event?: React.MouseEvent | React.KeyboardEvent,
  ) => any;
  // styles
  taskItemTextStyle?: React.CSSProperties;
  taskItemTextOutsideStyle?: React.CSSProperties;
};
type TOptionalPropsKeys = Exclude<OptionalKeys<IProps>, undefined>;
type TOptionalProps = Required<Pick<IProps, TOptionalPropsKeys>>;

export const defaultProps: TOptionalProps = {
  taskItemTextStyle: {
    fill: '#fff',
    textAnchor: 'middle',
    fontWeight: 'lighter',
    dominantBaseline: 'central',
    userSelect: 'none',
    pointerEvents: 'none',
  },
  taskItemTextOutsideStyle: {
    fill: '#555',
    textAnchor: 'start',
    userSelect: 'none',
    pointerEvents: 'none',
  },
};

const TaskItemOriginal = (
  props: IProps & typeof defaultProps & { options?: any },
) => {
  // *** PROPS ***
  const {
    task,
    rtl,
    isDateChangeable,
    isProgressChangeable,
    isDelete,
    isSelected,
    taskHeight,
    arrowIndent,
    onEventStart,
    // styles
    taskItemTextStyle,
    taskItemTextOutsideStyle,
    options,
  } = props;

  // *** USE STATE ***
  const [taskItem, setTaskItem] = useState<JSX.Element>(<div />);
  const [isTextInside, setIsTextInside] = useState(true);

  // *** USE REF ***
  const textRef = useRef<SVGTextElement>(null);

  // *** HANDLERS ***
  const getX = () => {
    const width = task.x2 - task.x1;
    const hasChild = task.barChildren.length > 0;
    if (isTextInside) {
      return task.x1 + width * 0.5;
    }
    if (rtl && textRef.current) {
      return (
        task.x1 -
        textRef.current.getBBox().width -
        arrowIndent * +hasChild -
        arrowIndent * 0.2
      );
    } else {
      return task.x1 + width + arrowIndent * +hasChild + arrowIndent * 0.2;
    }
  };

  // *** USE EFFECT ***
  useEffect(() => {
    switch (task.typeInternal) {
      case 'milestone':
        setTaskItem(<MileStone {...props} />);
        break;
      case 'project':
        setTaskItem(
          <Project
            task={task}
            // style
            backgroundStyle={{
              ...projectDefaultProps.backgroundStyle,
              fill: task.styles.backgroundColor,
              opacity: 1,
            }}
            progressStyle={{
              ...projectDefaultProps.progressStyle,
              fill: task.styles.progressSelectedColor,
            }}
          />,
        );
        break;
      case 'smalltask':
        setTaskItem(<BarSmall {...props} />);
        break;
      default:
        setTaskItem(() => (
          <BarOriginal
            task={task}
            rtl={rtl}
            isDateChangeable={isDateChangeable}
            isProgressChangeable={isProgressChangeable}
            onEventStart={onEventStart}
            options={options}
          />
        ));
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, isSelected]);

  useEffect(() => {
    if (textRef.current) {
      setIsTextInside(textRef.current.getBBox().width < task.x2 - task.x1);
      textRef.current.addEventListener('click', () => {
        if (task.title?.url) {
          window.open(task.title.url, '_blank');
        }
      });
    }
  }, [textRef, task]);

  return (
    <svg>
      {/* ROOT */}
      <g
        onKeyDown={(e) => {
          switch (e.key) {
            case 'Delete': {
              if (isDelete) onEventStart('delete', task, e);
              break;
            }
          }
          e.stopPropagation();
        }}
        onMouseEnter={(e) => {
          onEventStart('mouseenter', task, e);
        }}
        onMouseLeave={(e) => {
          onEventStart('mouseleave', task, e);
        }}
        onDoubleClick={(e) => {
          onEventStart('dblclick', task, e);
        }}
        onFocus={() => {
          onEventStart('select', task);
        }}
      >
        {/* TASK ITEM */}
        {taskItem}

        {/* TASK ITEM TEXT */}
        {task.title?.number && (
          <text
            style={{
              ...(isTextInside ? taskItemTextStyle : taskItemTextOutsideStyle),
              fontWeight: 'bold',
              fontSize: '0.8rem',
              fill: task.styles.backgroundColor
                .replace('borderColor', 'fgColor')
                .replace('-muted', ''),
            }}
            x={getX()}
            y={task.y + taskHeight * 0.5}
            ref={textRef}
          >
            {/* {task.status.name} */}
          </text>
        )}
      </g>
    </svg>
  );
};
TaskItemOriginal.defaultProps = defaultProps;

export default TaskItemOriginal;
