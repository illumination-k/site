import { IBlogRepositoy } from "./irepository";

export default class BlogService {
  repo: IBlogRepositoy;

  constructor(repo: IBlogRepositoy) {
    this.repo = repo;
  }
}
