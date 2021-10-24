import { Block } from "../block";

export default interface BlockDataSource {
  blocks(): AsyncGenerator<Block>;
}
