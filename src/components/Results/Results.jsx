import React from "react";
import * as d3 from "d3";

const filteredKeys = ['actualDuration', 'mountActualDuration', 'rerenderDuration', 'notMountRerenderDuration', 'updateDuration', 'averageNotMountRerenderDuration', 'averageActualDuration', 'averageUpdateDuration', 'medianActualDuration'];

function GroupedBarChart(data, canvas, {
  x = (d, i) => i, // given d in data, returns the (ordinal) x-value
  y = d => d, // given d in data, returns the (quantitative) y-value
  z = () => 1, // given d in data, returns the (categorical) z-value
  title, // given d in data, returns the title text
  marginTop = 30, // top margin, in pixels
  marginRight = 0, // right margin, in pixels
  marginBottom = 30, // bottom margin, in pixels
  marginLeft = 40, // left margin, in pixels
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  xDomain, // array of x-values
  xRange = [marginLeft, width - marginRight], // [xmin, xmax]
  xPadding = 0.1, // amount of x-range to reserve to separate groups
  yType = d3.scaleLinear, // type of y-scale
  yDomain, // [ymin, ymax]
  yRange = [height - marginBottom, marginTop], // [ymin, ymax]
  zDomain, // array of z-values
  zPadding = 0.05, // amount of x-range to reserve to separate bars
  yFormat, // a format specifier string for the y-axis
  yLabel, // a label for the y-axis
  colors = d3.schemeTableau10, // array of colors
} = {}) {
  // Compute values.
  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const Z = d3.map(data, z);

  // Compute default domains, and unique the x- and z-domains.
  if (xDomain === undefined) xDomain = X;
  if (yDomain === undefined) yDomain = [0, d3.max(Y)];
  if (zDomain === undefined) zDomain = Z;
  xDomain = new d3.InternSet(xDomain);
  zDomain = new d3.InternSet(zDomain);

  // Omit any data not present in both the x- and z-domain.
  const I = d3.range(X.length).filter(i => xDomain.has(X[i]) && zDomain.has(Z[i]));

  // Construct scales, axes, and formats.
  const xScale = d3.scaleBand(xDomain, xRange).paddingInner(xPadding);
  const xzScale = d3.scaleBand(zDomain, [0, xScale.bandwidth()]).padding(zPadding);
  const yScale = yType(yDomain, yRange);
  const zScale = d3.scaleOrdinal(zDomain, colors);
  const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
  const yAxis = d3.axisLeft(yScale).ticks(height / 60, yFormat);

  // Compute titles.
  if (title === undefined) {
    const formatValue = yScale.tickFormat(100, yFormat);
    title = i => `${X[i]}\n${Z[i]}\n${formatValue(Y[i])}`;
  } else {
    const O = d3.map(data, d => d);
    const T = title;
    title = i => T(O[i], i, data);
  }

  const svg = d3.select(canvas);
  svg.selectAll("*").remove(); // Clear svg content before adding new elements 

  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(yLabel));

  const bar = svg.append("g")
    .selectAll("rect")
    .data(I)
    .join("rect")
      .attr("x", i => xScale(X[i]) + xzScale(Z[i]))
      .attr("y", i => yScale(Y[i]))
      .attr("width", xzScale.bandwidth())
      .attr("height", i => yScale(0) - yScale(Y[i]))
      .attr("fill", i => zScale(Z[i]));

  if (title) bar.append("title")
      .text(title);

  svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(xAxis);

  return Object.assign(svg.node(), {scales: {color: zScale}});
}

export const Results = ({
  results,
  parsedResults
}) => {
  const svgRef3 = React.useRef(null);
  const svgRef4 = React.useRef(null);
  const svgWidth = 500;
  const svgHeight = 200;

  React.useEffect(() => {
    if (!parsedResults) return;

    const stateagesMountActualDuration = Object.values(parsedResults).map((row) => ({
      state: row.name.replace('ChangeOften', ''),
      type: row.name.toLowerCase().includes('usememo') ? "С мемоизацией" : "Без мемоизации",
      duration: row.averageMountActualDuration
    }))

    const stateagesRerenderDuration = Object.values(parsedResults).map((row) => ({
      state: row.name.replace('ChangeOften', ''),
      type: row.name.toLowerCase().includes('usememo') ? "С мемоизацией" : "Без мемоизации",
      duration: row.averageRerenderDuration
    }))

    const types = ["С мемоизацией", "Без мемоизации"]
    const chartOptions = {
      x: d => d.state,
      y: d => Math.round(d.duration),
      z: d => d.type,
      //xDomain: d3.groupSort(stateages, D => d3.sum(D, d => -d.duration), d => d.state).slice(0, 6),
      yLabel: "↑ Time (ms)",
      zDomain: types,
      colors: d3.schemeSpectral[types.length],
      width: svgWidth,
      height: svgHeight
    }

    GroupedBarChart(stateagesMountActualDuration, svgRef3.current, chartOptions)
    GroupedBarChart(stateagesRerenderDuration, svgRef4.current, chartOptions)
  }, [parsedResults]);

  const result = results[0];
  const keys = Object.keys(result);
  const parsed = Object.values(parsedResults);
  const parsedKeys = Object.keys(parsed[0]).filter(key => key !== "scenario");

  return (
    <div>
      <a href="/">Сгенерировать еще</a>
      <h1>Средние значения</h1>
      <table>
        <thead>
          <tr>{parsedKeys.map((th, i) => {
            if (filteredKeys.includes(th)) return null
            return (<th key={i}>{th}</th>)
          })}</tr>
        </thead>
        <tbody>
          {parsed.map(result => {
            const { scenario, ...obj } = result;
            return (<tr key={obj.name} style={obj.name.toLowerCase().includes('usememo')? {backgroundColor: '#eef2ff'} : null}>
              {Object.entries(obj).map(([key, value], i) => {
                if (filteredKeys.includes(key)) return null
                return (<td key={i}>{value.toString()}</td>)
              })}
            </tr>);
          })}
        </tbody>
      </table>
      <p><strong>среднее значение по всем прогонам:</strong></p>
      <div style={{display: 'inline-flex'}}>
      <span>
        <h2>Mount</h2>
        <svg ref={svgRef3} width={svgWidth} height={svgHeight} />
      </span>
      <span>
        <h2>Rerender (после смены значения)</h2>
        <svg ref={svgRef4} width={svgWidth} height={svgHeight} />
      </span>
      </div>
      <h1>Прогоны</h1>
      <table>
        <thead><tr>{keys.map((th, i) => (<th key={i}>{th}</th>))}</tr></thead>
        <tbody>
        {results.map((result, i) => (
          <tr key={`${result.scenarioId}_${result.run}_${i}`}>
            {keys.map(key => result[key]).map((td, i) => (<td key={i}>{td.toString()}</td>))}
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
};
