import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'secret'

export default function createUserToken(authorities: string[]) {
  const payload = {
    user_name: 'user1',
    user_uuid: '2aedad3a-f1fa-420f-9558-82c9490cb183',
    scope: ['read', 'write'],
    auth_source: 'nomis',
    authorities,
    jti: 'a610a10-cca6-41db-985f-e87efb303aaf',
    client_id: 'clientid',
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}
