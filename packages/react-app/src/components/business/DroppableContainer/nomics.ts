import { useEffect, useState } from "react";
import Nomics from "nomics";
import { NOMICS_API_KEY } from "../../../constants";

export const nomics = new Nomics({
  apiKey: NOMICS_API_KEY,
});

const exchangeRatesUrl = `https://api.nomics.com/v1/exchange-rates?key=${NOMICS_API_KEY}`;

async function getNomicsPrice(ids, convert = "USD") {
  return nomics.currenciesTicker({
    /*
      Specify the interval for interval data in return
      One or more strings can be provided. If not provided, **all** are used.
      The intervals specified will affect what is returned in the response (see below)
    */
    interval: ["1d"],
    /*
      Limit the returned currencies to the ones in the following array. If not
      specified, **all** will be returned
    */
    ids,
    /*
      Specify the currency to quote all returned prices in
    */
    convert,
  });
}

const useNomics = (): { pricesBySymbolMap: Map<string, number> } => {
  const [pricesBySymbolMap, setPricesBySymbol] = useState<Map<string, number>>();

  useEffect(() => {
    fetch(exchangeRatesUrl)
      .then(response => response.json())
      .then(rates => {
        const pricesMap = new Map<string, number>();
        rates.forEach(rate => pricesMap.set(rate.currency, Number(rate.rate)));
        setPricesBySymbol(pricesMap);
      });
  }, []);

  useEffect(() => {
    if (pricesBySymbolMap) console.log(pricesBySymbolMap.get("DAI"));
  }, [pricesBySymbolMap]);

  return { pricesBySymbolMap };
};

export default useNomics;
