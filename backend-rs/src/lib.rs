use std::{collections::HashMap, rc::Rc};

use near_sdk::{ borsh::{BorshDeserialize, BorshSerialize}, env, log, near_bindgen, AccountId, NearToken, PanicOnDefault };
use serde::Serialize;

#[derive(Debug, Clone, BorshDeserialize, BorshSerialize, Serialize)]
#[borsh(crate = "near_sdk::borsh")]
pub struct Message {
    id: AccountId,
    premium_attached: Option<NearToken>,
    message: String,
}

impl Message {
    pub fn new(id: AccountId, premium: Option<NearToken>, message: &str) -> Self {
        log!("Creating new Message");
        Self {
            id,
            premium_attached: premium,
            message: message.to_string(),
        }
    }
}
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault, Clone)]
#[borsh(crate = "near_sdk::borsh")]
pub struct MessageList {
    message_list_by_id: HashMap<AccountId, Vec<Rc<Message>>>,
    all_messages: Vec<Rc<Message>>,
    premium_messages: Vec<Rc<Message>>,
    highest_donation: Option<NearToken>,
}

#[near_bindgen]
impl MessageList {

    #[init]
    #[private]
    pub fn init() -> Self {
        Self {
            message_list_by_id: HashMap::new(),
            all_messages: vec![],
            premium_messages: vec![],
            highest_donation: None,
        }
    }

    #[payable]
    pub fn add_message(&mut self, message: String) {
        let premium = if env::attached_deposit().is_zero() {
            None
        } else {
            Some(env::attached_deposit())
        };
        log!("Donation: {}", env::attached_deposit());
        let message = Rc::new(Message::new(env::signer_account_id(), premium, &message));
        self.all_messages.push(Rc::clone(&message)); // Add owned copy of message to all messages
        log!("Added to all messages");
        // Update highest donation if such is the case
        self.highest_donation = match premium {
            None => self.highest_donation,
            Some(deposit) => {
                match self.highest_donation {
                    None => Some(deposit),
                    Some(previous_highest_donation) => {
                        if previous_highest_donation < deposit {
                            Some(deposit)
                        } else {
                            Some(previous_highest_donation)
                        }
                    }
                }
            }
        };
        // Add to premium messages if such is the case
        if !(env::attached_deposit().is_zero()) {
            self.premium_messages.push(Rc::clone(&message));
            log!("Added to premium messages");
        }

        // Update message_list_by_id
        self.message_list_by_id.entry(env::signer_account_id()).and_modify(|list| list.push(Rc::clone(&message))).or_insert(vec![Rc::clone(&message)]);
        log!("Updated hashmap entry");
    }

    pub fn get_messages(&self, offset: usize, limit: usize) -> Vec<Rc<Message>> {
        let len = self.all_messages.len();
        let upperlimit = if len < (offset*limit+limit) {
            0
        } else {
            len-offset*limit-limit
        };
        self.all_messages.clone()[upperlimit..].to_vec()
    }

    pub fn get_premium_messages(&self, offset: usize, limit: usize) -> Vec<Rc<Message>> {
        let len = self.premium_messages.len();
        let upperlimit = if len < (offset*limit+limit) {
            0
        } else {
            len-offset*limit-limit
        };
        self.premium_messages.clone()[upperlimit..].to_vec()
    }

    pub fn highest_donation(&self) -> NearToken {
        self.highest_donation.unwrap_or(NearToken::default())
    }

    pub fn messages_by_signed_in_user(&self) -> Vec<Rc<Message>> {
        (*self.message_list_by_id.get(&(env::signer_account_id())).unwrap_or(&vec![]).clone()).to_vec()
    }
 }



