module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('user_unit')
  },
  down: async () => {},
}
