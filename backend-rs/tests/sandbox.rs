use std::error::Error;
// macro allowing us to convert args into JSON bytes to be read by the contract.
use serde_json::json;


async fn prepare_dev_env() -> Result<(near_workspaces::Account, near_workspaces::Contract), Box<dyn Error>> {
    let worker = near_workspaces::sandbox().await?;
    let wasm = near_workspaces::compile_project("./").await?;
    let contract = worker.dev_deploy(&wasm).await?;
    let account = worker.dev_create_account().await?;
    Ok((account, contract))
}

#[tokio::test]
async fn returns_all_messages() -> Result<(), Box<dyn Error>>{
    let (account, contract) = prepare_dev_env().await?;
    let _ = account
    .call(contract.id(), "add_message")
    .args_json(json!({ "message": "Hi there "}))
    .transact()
    .await?;
    Ok(())
}