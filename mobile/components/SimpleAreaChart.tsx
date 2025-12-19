import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Path, G, Defs, LinearGradient, Stop, Line, Text as SvgText, Circle } from 'react-native-svg';
import { theme } from '../theme';

interface SimpleAreaChartProps {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
}

export function SimpleAreaChart({ 
  data, 
  labels, 
  width = 300, 
  height = 200, 
  color = theme.colors.primary 
}: SimpleAreaChartProps) {
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  const { path, maxValue, minValue } = useMemo(() => {
    if (data.length === 0) return { path: '', maxValue: 1, minValue: 0 };
    
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    
    let pathData = `M ${padding.left} ${padding.top + chartHeight}`;
    
    data.forEach((value, index) => {
      const x = padding.left + index * stepX;
      const normalizedValue = value - min;
      const range = max - min || 1;
      const y = padding.top + chartHeight - (normalizedValue / range) * chartHeight;
      pathData += ` L ${x} ${y}`;
    });
    
    const lastX = data.length > 1 ? padding.left + (data.length - 1) * stepX : padding.left;
    pathData += ` L ${lastX} ${padding.top + chartHeight} Z`;
    
    return { path: pathData, maxValue: max, minValue: min };
  }, [data, chartWidth, chartHeight, padding.left, padding.top, stepX]);

  const getYLabel = (value: number) => {
    const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;
    return y;
  };

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartHeight * (1 - ratio);
          const value = minValue + (maxValue - minValue) * ratio;
          return (
            <G key={i}>
              <Line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke={theme.colors.border + '40'}
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <SvgText
                x={padding.left - 10}
                y={y + 4}
                fontSize="10"
                fill={theme.colors.mutedForeground}
                textAnchor="end"
              >
                {Math.round(value)}
              </SvgText>
            </G>
          );
        })}
        
        {/* Area */}
        <Path
          d={path}
          fill="url(#areaGradient)"
          stroke={color}
          strokeWidth="2"
        />
        
        {/* Data points */}
        {data.map((value, index) => {
          const x = padding.left + index * stepX;
          const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;
          
          return (
            <G key={index}>
              <Circle cx={x} cy={y} r="3" fill={color} />
              {labels && labels[index] && (
                <SvgText
                  x={x}
                  y={height - 10}
                  fontSize="9"
                  fill={theme.colors.mutedForeground}
                  textAnchor="middle"
                >
                  {labels[index]}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

