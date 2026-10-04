import { ReportRepository } from '../repositories/reportRepository.js';

export class ReportService {
  constructor(repository = new ReportRepository()) {
    this.repository = repository;
  }

  dashboard() {
    return this.repository.dashboard();
  }

  summary(filters, user) {
    return this.repository.summary(filters, user);
  }
}