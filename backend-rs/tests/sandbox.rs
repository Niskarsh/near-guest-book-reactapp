use std::{error::Error, rc::Rc};
use backend_rs::Message;
use near_sdk::NearToken;
// macro allowing us to convert args into JSON bytes to be read by the contract.
use serde_json::{json, Map, Value};


async fn prepare_dev_env() -> Result<(Vec<near_workspaces::Account>, near_workspaces::Contract), Box<dyn Error>> {
    let worker = near_workspaces::sandbox().await?;
    let wasm = near_workspaces::compile_project("./").await?;
    let contract = worker.dev_deploy(&wasm).await?;
    // Call init method
    let _ = contract.call("init")
    .args_json(json!({}))
    .transact()
    .await?;
    let account = worker.dev_create_account().await?;
    let account1 = worker.dev_create_account().await?;
    let account2 = worker.dev_create_account().await?;
    Ok((vec![account, account1, account2], contract))
}

#[tokio::test]
async fn returns_all_messages() -> Result<(), Box<dyn Error>>{
    let (account, contract) = prepare_dev_env().await?;
    // println!("{:?}", account);
    let _ = account[0]
    .call(contract.id(), "add_message")
    .args_json(json!({ "message": "Hi there "}))
    .transact()
    .await?;

    let recieved_messages: serde_json::Value = account[0].view(contract.id(), "get_messages")
    .args_json(json!({ "offset": 0, "limit": 10 }))
    .await?
    .json()?;
    let dummy = vec![json!({ "id": "123"})];

    assert_ne!(recieved_messages.as_array().unwrap_or(&vec![]).len(), 0);

    let messages_extracted = recieved_messages.as_array().unwrap_or(&dummy)[0].as_object();

    match messages_extracted {
        None => {},
        Some(object) => {
            assert_eq!(object["id"], account[0].id().to_string());
        },
    };

    // Check if messages are lost once retrieved
    let recieved_messages: serde_json::Value = account[0].view(contract.id(), "get_messages")
    .args_json(json!({ "offset": 0, "limit": 10 }))
    .await?
    .json()?;
    let dummy = vec![json!({ "id": "123"})];

    assert_ne!(recieved_messages.as_array().unwrap_or(&vec![]).len(), 0);

    let messages_extracted = recieved_messages.as_array().unwrap_or(&dummy)[0].as_object();

    match messages_extracted {
        None => {},
        Some(object) => {
            assert_eq!(object["id"], account[0].id().to_string());
        },
    };
    Ok(())
}

#[tokio::test]
async fn verify_highest_donation() -> Result<(), Box<dyn Error>>{
    let (account, contract) = prepare_dev_env().await?;
    let _ = account[0]
    .call(contract.id(), "add_message")
    .args_json(json!({ "message": "Hi there "}))
    .transact()
    .await?;

    let _ = account[1]
    .call(contract.id(), "add_message")
    .args_json(json!({ "message": "Hi there. I am rich "}))
    .deposit(NearToken::from_near(20))
    .transact()
    .await?;

    let _ = account[2]
    .call(contract.id(), "add_message")
    .args_json(json!({ "message": "Hi there. I am richer "}))
    .deposit(NearToken::from_near(50))
    .transact()
    .await?;

    let recieved_messages: serde_json::Value = account[0].view(contract.id(), "get_messages")
    .args_json(json!({ "offset": 0, "limit": 10 }))
    .await?
    .json()?;

    // println!("{:?}", recieved_messages);

    assert_ne!(recieved_messages.as_array().unwrap_or(&vec![]).len(), 0);

    let highest_donation= account[0]
    .view(contract.id(), "highest_donation")
    .args_json(json!({}))
    .await?
    .json::<NearToken>()?;

    assert_eq!(highest_donation, NearToken::from_near(50));

    let premium_messages = contract
    .view("get_premium_messages")
    .args_json(json!({ "offset": 0, "limit": 10 }))
    .await?
    // .json()?;
    .json::<Vec<Map<String, Value>>>()?;

    println!("{:?}", premium_messages);
    
    Ok(())
}
