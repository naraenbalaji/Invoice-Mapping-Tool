import React from "react";
import {
  PieChart,
  Pie,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function PieChartJs({ data , total}) {
  console.log(data)
  const chartData = data?.map((item, index) => ({
    ...item,
    fill: index === 0 ? "red" : "#01014e",
    value: item.count,   
    name: item.status,   
  }));
  

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };


  return (
    <ResponsiveContainer height={300} width="100%" style={{ maxWidth: 600 }}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          startAngle={90}
          endAngle={-270}
          label={renderCustomizedLabel}
          labelLine={false}
        >
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            <tspan
              x="50%"
              dy="-0.5em"
              fontSize="28"
              fontWeight="bold"
              fill="#01014e"
            >
              {total}
            </tspan>
            <tspan
              x="50%"
              dy="1.2em"
              fontSize="14"
              fontWeight="normal"
              fill="#555"
            >
              Files Uploaded
            </tspan>
          </text>
        </Pie>

        <Tooltip formatter={(value) => [`${value}`, "Count"]} />

        <Legend
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          wrapperStyle={{ marginTop: 20 }}
        />
      </PieChart>
      
    </ResponsiveContainer>
  );
}
