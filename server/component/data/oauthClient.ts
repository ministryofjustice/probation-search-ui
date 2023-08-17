export default interface OAuthClient {
  getSystemClientToken(username: string): Promise<string>
}
