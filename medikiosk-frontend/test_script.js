
async function test() {
  let isLoading = true;
  let showConfirm = false;
  try {
    throw new Error("500 internal server error");
  } catch (e) {
    showConfirm = true;
    // simulating checkRedFlags which throws an error
    // let text = undefined;
    // text.toLowerCase();
  } finally {
    isLoading = false;
  }
  console.log({isLoading, showConfirm});
}
test();

