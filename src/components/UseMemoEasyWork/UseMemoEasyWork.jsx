import React, { useMemo } from "react";
import { easyValueComputation } from "../../utils";

export const UseMemoEasyWork = ({ value }) => {
  const easyValue = useMemo(() => easyValueComputation(value), [value]);

  return <div>{easyValue}</div>;
};
