import { RTKApi } from '@/apiConnection'

const studentsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    searchStudents: builder.query({
      query: searchTerm => `/students/?searchTerm=${searchTerm}`,
    }),
    getStudent: builder.query({
      query: studentNumber => `/students/${studentNumber}`,
    }),
  }),
  overrideExisting: false,
})

export const { useSearchStudentsQuery, useGetStudentQuery } = studentsApi
