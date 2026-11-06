/**
 * Unit Converter Tool
 * Handles conversions across Energy (calories, joules), Mass (kg, lbs, oz),
 * Length (m, km, ft, in), Volume (liters, ml, cups), and Temperature (C, F, K).
 */

export interface ConversionResult {
  fromValue: number;
  fromUnit: string;
  toUnit: string;
  result: number;
  formatted: string;
  category: string;
}

export function convertUnits(value: number, fromUnit: string, toUnit: string): ConversionResult | { error: string } {
  const f = fromUnit.trim().toLowerCase();
  const t = toUnit.trim().toLowerCase();

  // 1. Energy
  const energyFactors: Record<string, number> = {
    kcal: 4184,
    calories: 4.184,
    cal: 4.184,
    joules: 1,
    j: 1,
    kj: 1000,
    kwh: 3600000,
  };
  if (energyFactors[f] && energyFactors[t]) {
    const joules = value * energyFactors[f];
    const converted = joules / energyFactors[t];
    return {
      fromValue: value,
      fromUnit,
      toUnit,
      result: converted,
      formatted: `${value} ${fromUnit} = ${converted.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toUnit}`,
      category: "Energy",
    };
  }

  // 2. Mass
  const massFactors: Record<string, number> = {
    kg: 1,
    kilogram: 1,
    kilograms: 1,
    g: 0.001,
    gram: 0.001,
    grams: 0.001,
    mg: 0.000001,
    lb: 0.45359237,
    lbs: 0.45359237,
    pound: 0.45359237,
    pounds: 0.45359237,
    oz: 0.0283495,
    ounce: 0.0283495,
    ounces: 0.0283495,
  };
  if (massFactors[f] && massFactors[t]) {
    const kg = value * massFactors[f];
    const converted = kg / massFactors[t];
    return {
      fromValue: value,
      fromUnit,
      toUnit,
      result: converted,
      formatted: `${value} ${fromUnit} = ${converted.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toUnit}`,
      category: "Mass",
    };
  }

  // 3. Length
  const lengthFactors: Record<string, number> = {
    m: 1,
    meter: 1,
    meters: 1,
    cm: 0.01,
    centimeter: 0.01,
    centimeters: 0.01,
    mm: 0.001,
    km: 1000,
    kilometer: 1000,
    kilometers: 1000,
    in: 0.0254,
    inch: 0.0254,
    inches: 0.0254,
    ft: 0.3048,
    foot: 0.3048,
    feet: 0.3048,
    yard: 0.9144,
    yards: 0.9144,
    mile: 1609.344,
    miles: 1609.344,
  };
  if (lengthFactors[f] && lengthFactors[t]) {
    const meters = value * lengthFactors[f];
    const converted = meters / lengthFactors[t];
    return {
      fromValue: value,
      fromUnit,
      toUnit,
      result: converted,
      formatted: `${value} ${fromUnit} = ${converted.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toUnit}`,
      category: "Length",
    };
  }

  // 4. Volume
  const volumeFactors: Record<string, number> = {
    l: 1,
    liter: 1,
    liters: 1,
    ml: 0.001,
    milliliter: 0.001,
    cup: 0.236588,
    cups: 0.236588,
    tbsp: 0.0147868,
    tsp: 0.00492892,
    gallon: 3.78541,
    gallons: 3.78541,
    floz: 0.0295735,
  };
  if (volumeFactors[f] && volumeFactors[t]) {
    const liters = value * volumeFactors[f];
    const converted = liters / volumeFactors[t];
    return {
      fromValue: value,
      fromUnit,
      toUnit,
      result: converted,
      formatted: `${value} ${fromUnit} = ${converted.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toUnit}`,
      category: "Volume",
    };
  }

  // 5. Temperature
  const isC = f === "c" || f === "celsius";
  const isF = f === "f" || f === "fahrenheit";
  const isK = f === "k" || f === "kelvin";

  const toC = t === "c" || t === "celsius";
  const toF = t === "f" || t === "fahrenheit";
  const toK = t === "k" || t === "kelvin";

  if ((isC || isF || isK) && (toC || toF || toK)) {
    let celsius = value;
    if (isF) celsius = ((value - 32) * 5) / 9;
    if (isK) celsius = value - 273.15;

    let targetVal = celsius;
    if (toF) targetVal = (celsius * 9) / 5 + 32;
    if (toK) targetVal = celsius + 273.15;

    return {
      fromValue: value,
      fromUnit,
      toUnit,
      result: targetVal,
      formatted: `${value}° ${fromUnit} = ${targetVal.toFixed(2)}° ${toUnit}`,
      category: "Temperature",
    };
  }

  return { error: `Unsupported unit conversion between '${fromUnit}' and '${toUnit}'.` };
}
