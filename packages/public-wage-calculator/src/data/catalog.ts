import administrative from "../../data/coefficients/administrative.json" assert { type: "json" };
import advocacy from "../../data/coefficients/advocacy.json" assert { type: "json" };
import arsimi from "../../data/coefficients/arsimi.json" assert { type: "json" };
import auditimiIBrendshem from "../../data/coefficients/auditimi-i-brendshem.json" assert { type: "json" };
import auditimi from "../../data/coefficients/auditimi.json" assert { type: "json" };
import doganaEKosoves from "../../data/coefficients/dogana-e-kosoves.json" assert { type: "json" };
import experts from "../../data/coefficients/experts.json" assert { type: "json" };
import forcaESiguriseSeKosoves from "../../data/coefficients/forca-e-sigurise-se-kosoves.json" assert { type: "json" };
import funksionaretPublik from "../../data/coefficients/funksionaret-publik.json" assert { type: "json" };
import gjyqesor from "../../data/coefficients/gjyqesor.json" assert { type: "json" };
import inspektoratiPolicorIKosoves from "../../data/coefficients/inspektorati-policor-i-kosoves.json" assert { type: "json" };
import kabinet from "../../data/coefficients/kabinet.json" assert { type: "json" };
import kultureArt from "../../data/coefficients/kulture-art.json" assert { type: "json" };
import njesiaPerInteligjenceFinanciare from "../../data/coefficients/njesia-per-inteligjence-financiare.json" assert { type: "json" };
import policiaEKosoves from "../../data/coefficients/policia-e-kosoves.json" assert { type: "json" };
import shendetesi from "../../data/coefficients/shendetesi.json" assert { type: "json" };
import sherbimiCivil from "../../data/coefficients/sherbimi-civil.json" assert { type: "json" };
import sherbimiIJashtem from "../../data/coefficients/sherbimi-i-jashtem.json" assert { type: "json" };
import sherbimiKorrektuesIKosoves from "../../data/coefficients/sherbimi-korrektues-i-kosoves.json" assert { type: "json" };
import sistemiGjyqesor from "../../data/coefficients/sistemi-gjyqesor.json" assert { type: "json" };
import sistemiProkurorial from "../../data/coefficients/sistemi-prokurorial.json" assert { type: "json" };
import zjarrefikesit from "../../data/coefficients/zjarrefikesit.json" assert { type: "json" };
import { assertPositionCoefficientArray } from "../lib/validation";

const coefficientGroups = [
  administrative,
  advocacy,
  arsimi,
  auditimiIBrendshem,
  auditimi,
  doganaEKosoves,
  experts,
  forcaESiguriseSeKosoves,
  funksionaretPublik,
  gjyqesor,
  inspektoratiPolicorIKosoves,
  kabinet,
  kultureArt,
  njesiaPerInteligjenceFinanciare,
  policiaEKosoves,
  shendetesi,
  sherbimiCivil,
  sherbimiIJashtem,
  sherbimiKorrektuesIKosoves,
  sistemiGjyqesor,
  sistemiProkurorial,
  zjarrefikesit,
] as unknown[][];

const coefficientsRaw = coefficientGroups.flat();
assertPositionCoefficientArray(coefficientsRaw);

export const COEFFICIENT_CATALOG = coefficientsRaw;
