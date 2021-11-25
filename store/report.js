export const state = () => ({
  reports: null,
  media: null,
  selectedReport: null,
  reportLoading: false,
  weightRange: {
    min: 1,
    max: 1,
  },
  filters: {
    weight: {
      min: 0,
      max: 30,
    },
    locations: [],
    baits: [],
    techniques: [],
    years: [],
  },
})

export const mutations = {
  setAllReports(state, payload) {
    state.reports = payload.slice()
  },
  setSelectedReport(state, payload) {
    state.selectedReport = payload
  },
  setReportLoading(state, payload) {
    state.reportLoading = payload
  },
  setWeightFilter(state, payload) {
    state.filters.weight.min = payload.min
    state.filters.weight.max = payload.max
  },
  setLocationFilter(state, payload) {
    state.filters.locations = payload
  },
  setWeightRange(state, payload) {
    state.weightRange.min = payload.min
    state.weightRange.max = payload.max
  },
  setBaitsFilter(state, payload) {
    state.filters.baits = payload
  },
  setTechniquesFilter(state, payload) {
    state.filters.techniques = payload
  },
  setYearsFilter(state, payload) {
    state.filters.years = payload
  },
}

export const actions = {
  setWeightFilter(context, payload) {
    context.commit('setWeightFilter', payload)
  },
  setLocationFilter(context, payload) {
    context.commit('setLocationFilter', payload)
  },
  setWeightRange(context, payload) {},
  async addReport(context, payload) {
    const report = payload
    this.$fire.firestore
      .collection('report')
      .doc(this.$fire.auth.currentUser.uid)
      .collection('userReports')
      .doc()
      .set({
        report,
        createdAt: this.$fireModule.firestore.Timestamp.now(),
      })
      .then(() => {
        console.log('Added')
      })
      .catch((error) => {
        console.error('Error writing document: ', error)
      })
  },
  async updateReport(context, payload) {
    const report = payload.report
    const id = payload.id
    this.$fire.firestore
      .collection('report')
      .doc(this.$fire.auth.currentUser.uid)
      .collection('userReports')
      .doc(id)
      .update({
        report,
      })
      .then(() => {
        console.log('Updated')
      })
      .catch((error) => {
        console.error('Error writing document: ', error)
      })
  },
  async getAllReports(context, payload) {
    let reports = []

    await this.$fire.firestore
      .collection('report')
      .doc(this.$fire.auth.currentUser.uid)
      .collection('userReports')
      .get()
      .then((snapshot) => {
        snapshot.docs.map((doc) => {
          let report = {
            id: null,
            report: null,
          }
          report.id = doc.id
          report.report = doc.data()
          reports.push(report)
        })
      })
    context.dispatch('setAllReports', reports)

    let weightRangeMin = context.state.weightRange.min
    let weightRangeMax = context.state.weightRange.max

    if (
      reports.length > 0 &&
      reports[0].report.report.general.weight !== null
    ) {
      weightRangeMin = reports[0].report.report.general.weight
      weightRangeMax = reports[0].report.report.general.weight
    }

    reports.forEach((report) => {
      if (report.report.report.general.weight !== null) {
        if (report.report.report.general.weight < weightRangeMin) {
          weightRangeMin = parseInt(report.report.report.general.weight) - 1
        }

        if (report.report.report.general.weight > weightRangeMax) {
          weightRangeMax = parseInt(report.report.report.general.weight) + 1
        }
      }
    })

    const weightRange = {
      min: parseInt(weightRangeMin),
      max: parseInt(weightRangeMax),
    }
    context.commit('setWeightRange', weightRange)
  },
  async getReport(context, payload) {
    let report = {
      id: null,
      report: null,
    }
    if (payload !== null) {
      await this.$fire.firestore
        .collection('report')
        .doc(this.$fire.auth.currentUser.uid)
        .collection('userReports')
        .doc(payload)
        .get()
        .then((doc) => {
          report.id = doc.id
          report.report = doc.data()
          context.dispatch('setSelectedReport', report)
        })
    } else {
      context.dispatch('setSelectedReport', null)
    }
  },
  setAllReports(context, payload) {
    context.commit('setAllReports', payload)
  },
  setSelectedReport(context, payload) {
    context.commit('setSelectedReport', payload)
  },
  setReportLoading(context, payload) {
    context.commit('setReportLoading', payload)
  },
}

export const getters = {
  allReports(state) {
    let reports = state.reports
    if (reports !== null) {
      const reportsWeightFiltered = reports.filter((report) => {
        if (report.report.report.general.weight == null) return true
        return isBetween(
          state.filters.weight.min,
          state.filters.weight.max,
          report.report.report.general.weight
        )
      })
      reports = reportsWeightFiltered

      if (state.filters.locations.length > 0) {
        const reportsLocationsFiltered = reports.filter((report) =>
          isIncluded(
            state.filters.locations,
            report.report.report.location.place
          )
        )
        reports = reportsLocationsFiltered
      }

      if (state.filters.baits.length > 0) {
        const reportsBaitssFiltered = reports.filter((report) =>
          isIncluded(state.filters.baits, report.report.report.general.bait)
        )
        reports = reportsBaitssFiltered
      }

      if (state.filters.techniques.length > 0) {
        const reportsTechniquesFiltered = reports.filter((report) =>
          isIncluded(
            state.filters.techniques,
            report.report.report.general.technique
          )
        )
        reports = reportsTechniquesFiltered
      }

      if (state.filters.years.length > 0) {
        const reportsYearsFiltered = reports.filter((report) => {
          const year = new Date(report.report.report.general.date).getFullYear()
          return isIncluded(state.filters.years, year)
        })
        reports = reportsYearsFiltered
      }
    }

    return reports
  },
  allYears(state) {
    let reports = state.reports
    let years = []

    if (reports && reports.length > 0) {
      reports.forEach((report) => {
        const date = new Date(report.report.report.general.date)
        const year = date.getFullYear()
        if (!years.includes(year)) {
          years.push(year)
        }
      })
    }

    return years
  },
}

const isBetween = (min, max, value) => value >= min && value <= max
const isIncluded = (array, value) => {
  return array.includes(value)
}
