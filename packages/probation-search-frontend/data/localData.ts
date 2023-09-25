export default [
  {
    offenderId: 1,
    otherIds: { crn: 'A000001' },
    firstName: 'John',
    surname: 'Doe',
    dateOfBirth: '1980-01-01',
    age: 43,
    gender: 'Male',
    currentDisposal: '1',
    offenderManagers: [
      {
        active: true,
        probationArea: { code: 'N07', description: 'London' },
        staff: { forenames: 'Probation', surname: 'Practitioner' },
      },
    ],
    highlight: {},
  },
  {
    offenderId: 2,
    firstName: 'Jane',
    surname: 'Doe',
    dateOfBirth: '1982-02-02',
    age: 41,
    gender: 'Female',
    currentDisposal: '0',
    otherIds: { crn: 'A000002' },
    offenderManagers: [
      {
        active: true,
        probationArea: { code: 'N07', description: 'London' },
        staff: { forenames: 'Probation', surname: 'Practitioner' },
      },
    ],
    highlight: {},
  },
]
