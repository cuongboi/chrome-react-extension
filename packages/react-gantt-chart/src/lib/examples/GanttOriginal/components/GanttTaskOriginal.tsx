// *** NPM ***
import React, { useRef, useEffect } from 'react';

import Calendar, {
  IProps as CalendarProps,
} from '../../../containers/Calendar/Calendar';
// *** OTHER ***
import Grid, { IProps as GridProps } from '../../../containers/Grid/Grid';
import { OptionalKeys } from '../../../types/custom';
import GanttTaskContentOriginal, {
  IProps as GanttTaskContentOriginalProps,
} from './GanttTaskContentOriginal';

// *** TYPES ***
export type IProps = {
  gridProps: GridProps;
  calendarProps: CalendarProps;
  barProps: GanttTaskContentOriginalProps;
  ganttHeight: number;
  scrollX: number;
  scrollY: number;
  // style
  rootStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
};
type TOptionalPropsKeys = Exclude<OptionalKeys<IProps>, undefined>;
type TOptionalProps = Required<Pick<IProps, TOptionalPropsKeys>>;

export const defaultProps: TOptionalProps = {
  // style
  rootStyle: {
    overflow: 'hidden',
    margin: 0,
    padding: 0,
    fontSize: 0,
  },
  contentStyle: {
    overflow: 'hidden',
    margin: 0,
    padding: 0,
  },
};

const GanttTaskOriginal = (props: IProps & typeof defaultProps) => {
  // *** PROPS ***
  const {
    gridProps,
    calendarProps,
    barProps,
    ganttHeight,
    scrollY,
    scrollX,
    // style
    rootStyle,
    contentStyle,
  } = props;

  // *** USE REF ***
  const ganttSVGRef = useRef<SVGSVGElement>(null);
  const horizontalContainerRef = useRef<HTMLDivElement>(null);
  const verticalGanttContainerRef = useRef<HTMLDivElement>(null);

  // *** USE EFFECT ***
  useEffect(() => {
    if (horizontalContainerRef.current) {
      horizontalContainerRef.current.scrollTop = scrollY;
    }
  }, [scrollY]);

  useEffect(() => {
    if (verticalGanttContainerRef.current) {
      verticalGanttContainerRef.current.scrollLeft = scrollX;
    }
  }, [scrollX]);

  // *** CONDITIONALS ***
  const newBarProps = { ...barProps, svg: ganttSVGRef };

  return (
    // ROOT
    <div
      style={rootStyle}
      ref={verticalGanttContainerRef}
      dir="ltr"
      className="border-t border-border"
    >
      {/* CALENDAR */}
      <svg
        height={calendarProps.headerHeight - 1}
        width={gridProps.svgWidth}
        fontFamily={barProps.fontFamily}
        xmlns="http://www.w3.org/2000/svg"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <Calendar {...calendarProps} />
      </svg>

      {/* CONTENT */}
      <div
        ref={horizontalContainerRef}
        style={{
          ...contentStyle,
          height: ganttHeight || undefined,
          width: gridProps.svgWidth,
        }}
      >
        <svg
          ref={ganttSVGRef}
          height={barProps.rowHeight * barProps.tasks.length}
          width={gridProps.svgWidth}
          fontFamily={barProps.fontFamily}
          xmlns="http://www.w3.org/2000/svg"
        >
          <Grid {...gridProps} />

          <GanttTaskContentOriginal {...newBarProps} />
        </svg>
      </div>
    </div>
  );
};
GanttTaskOriginal.defaultProps = defaultProps;

export default GanttTaskOriginal;
