import React, {
  Profiler,
  useState,
  useRef,
  useEffect
} from "react";
import { onNextFrame, parseResults } from "../utils";
import { Results } from "../components/Results/Results";
import { scenarios } from "../scenarios";

const PERFORMANCE_KEY = "performance";
const RUN_ID_KEY = "runId";
const REPEAT_KEY = "repeat";

const PerformanceCollector = ({ data }) => {
  //get URL param
  const query = window.location.href.split("?")[1];
  const url = window.location.href.split("?")[0];
  //   set up performance meter storage
  const performance = useRef([]);
  const runId = useRef(0);
  const repetition = useRef(0);
  const [initialized, setInitialized] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    //   get info from session storage. Clear session storage if no URL parameter is present
    if (query) {
      const params = new URLSearchParams(query);
      if (params.has(RUN_ID_KEY) && params.has(REPEAT_KEY)) {
        runId.current = parseInt(params.get(RUN_ID_KEY) || "0", 10);
        repetition.current = parseInt(params.get(REPEAT_KEY) || "0", 10);

        const data = sessionStorage.getItem(PERFORMANCE_KEY);

        if (data) {
          performance.current = JSON.parse(data);
        }
      } else {
        sessionStorage.clear();
      }
    } else {
      sessionStorage.clear();
    }
    setInitialized(true);
  }, [query]);

  const scenario = scenarios[runId.current];

  // rerender counter
  const [incrementer, setIncrementer] = useState(0);

  //performance meter callback
  const onRender = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    const data = {
      run: repetition.current * scenario.limit + incrementer,
      valueChanged: incrementer % scenario.frequency === 0,
      scenarioId: runId.current,
      repetition: repetition.current,
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime
    };
    if (initialized) {
      performance.current.push(data);
    }
  };

  // continue until limit is achieved
  if (!done && scenario && initialized && incrementer < scenario.limit) {
    //after everything is rendered in the DOM
    onNextFrame(() => {
      //increment
      const newValue = incrementer + 1;
      // if still under the limit, continue
      if (newValue < scenario.limit) {
        setIncrementer(newValue);
      } else {
        //  store results
        sessionStorage.setItem(
          PERFORMANCE_KEY,
          JSON.stringify(performance.current)
        );
        // if repetitions are left, repeat
        if (repetition.current < scenario.repeat - 1) {
          window.location.href = `${url}?${RUN_ID_KEY}=${runId.current
            }&${REPEAT_KEY}=${repetition.current + 1}`;
        }
        // if scenarios are left, go to the next one
        else if (runId.current < scenarios.length - 1) {
          window.location.href = `${url}?${RUN_ID_KEY}=${runId.current +
            1}&${REPEAT_KEY}=0`;
        } else {
          // nothing more to do, parse and print results
          setDone(true);
        }
      }
    });
  }
  const Component = scenario?.component;

  const added = incrementer - (incrementer % scenario?.frequency);

  return initialized ? (
    (!done && Component) ? (
      <div key={runId.current}>
        <div>
          <a href="/">RESET</a>
        </div>
        <Profiler id={scenario.name} onRender={onRender}>
          {data.map(e => (
            <Component value={e + added} key={e} />
          ))}
        </Profiler>
      </div>
    ) : (
      <Results
        results={performance.current || {}}
        parsedResults={parseResults(performance.current)}
      />
    )
  ) : null;
};

export default PerformanceCollector;
