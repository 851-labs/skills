import {
  createInfiniteQueryProcedure,
  createQueryProcedure,
  createQueryProcedureWithInput,
} from "./create-procedure";
import {
  getSkillByIdFn,
  getSkillsByOwnerFn,
  getSkillsByRepoFn,
  getSkillsPaginatedFn,
  getSkillsStatsFn,
} from "./skills.server";

const api = {
  skills: {
    stats: createQueryProcedure(["skills", "stats"], getSkillsStatsFn),
    paginated: createInfiniteQueryProcedure(["skills", "paginated"], getSkillsPaginatedFn),
    byId: createQueryProcedureWithInput(["skills", "byId"], getSkillByIdFn),
    byOwner: createInfiniteQueryProcedure(["skills", "byOwner"], getSkillsByOwnerFn),
    byRepo: createQueryProcedureWithInput(["skills", "byRepo"], getSkillsByRepoFn),
  },
};

export { api };
